import { db } from "@workspace/db";
import { notificationsTable, pushTokensTable, usersTable } from "@workspace/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Central notification module for ABSHER TRAVEL.
 *
 * Every notification records an in-app row (channel "in_app") AND fires a REAL
 * Expo push to every registered device of the recipient. Push copy is chosen
 * from the recipient's `preferredLanguage` ("ar" → Arabic, "en" → English) so
 * languages are never mixed inside one notification.
 *
 * All push sending is fire-and-forget: failures are logged and never thrown
 * into the calling route. Tokens that Expo reports as "DeviceNotRegistered"
 * are deleted so we stop sending to dead devices.
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const PUSH_CHUNK = 100;
const DB_CHUNK = 100;

export interface NotifyPayload {
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
  url?: string | null;
  /** Admin user id when this is an admin broadcast; null/undefined for system. */
  sentBy?: string | null;
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  sound: "default";
  data: {
    relatedEntityType?: string | null;
    relatedEntityId?: string | null;
    url?: string | null;
  };
}

/** Row shape carrying the language needed to build push copy. */
interface Recipient {
  userId: string;
  preferredLanguage: string;
}

function pickCopy(payload: NotifyPayload, lang: string) {
  const ar = lang !== "en";
  return {
    title: ar ? payload.titleAr : payload.titleEn,
    body: ar ? payload.messageAr : payload.messageEn,
  };
}

/**
 * Send the given Expo messages in chunks and prune any token Expo reports as
 * unregistered. Never throws.
 */
async function sendExpoPush(messages: Array<ExpoMessage>): Promise<void> {
  if (messages.length === 0) return;
  for (let i = 0; i < messages.length; i += PUSH_CHUNK) {
    const chunk = messages.slice(i, i + PUSH_CHUNK);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chunk),
      });
      if (!res.ok) {
        logger.error({ status: res.status }, "Expo push request failed");
        continue;
      }
      const json = (await res.json()) as {
        data?: Array<{ status: string; message?: string; details?: { error?: string } }>;
      };
      const tickets = json.data ?? [];
      const deadTokens: string[] = [];
      tickets.forEach((ticket, idx) => {
        if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
          const msg = chunk[idx];
          if (msg) deadTokens.push(msg.to);
        }
      });
      if (deadTokens.length > 0) {
        try {
          await db.delete(pushTokensTable).where(inArray(pushTokensTable.token, deadTokens));
          logger.info({ count: deadTokens.length }, "Pruned unregistered push tokens");
        } catch (delErr) {
          logger.error({ err: delErr }, "Failed to prune unregistered push tokens");
        }
      }
    } catch (err) {
      logger.error({ err }, "Failed to send Expo push chunk");
    }
  }
}

/**
 * Load push tokens for the given user ids and build Expo messages using each
 * user's preferred language. Never throws.
 */
async function buildMessagesForRecipients(
  recipients: Array<Recipient>,
  payload: NotifyPayload,
): Promise<Array<ExpoMessage>> {
  if (recipients.length === 0) return [];
  const langByUser = new Map<string, string>();
  for (const r of recipients) langByUser.set(r.userId, r.preferredLanguage ?? "ar");

  const userIds = [...langByUser.keys()];
  const tokens: Array<{ token: string; userId: string }> = [];
  for (let i = 0; i < userIds.length; i += DB_CHUNK) {
    const slice = userIds.slice(i, i + DB_CHUNK);
    const rows = await db
      .select({ token: pushTokensTable.token, userId: pushTokensTable.userId })
      .from(pushTokensTable)
      .where(inArray(pushTokensTable.userId, slice));
    tokens.push(...rows);
  }

  const messages: Array<ExpoMessage> = [];
  for (const t of tokens) {
    const { title, body } = pickCopy(payload, langByUser.get(t.userId) ?? "ar");
    messages.push({
      to: t.token,
      title,
      body,
      sound: "default",
      data: {
        relatedEntityType: payload.relatedEntityType ?? null,
        relatedEntityId: payload.relatedEntityId ?? null,
        url: payload.url ?? null,
      },
    });
  }
  return messages;
}

/** Insert in-app notification rows for the given user ids, chunked. */
async function insertInAppRows(userIds: Array<string>, payload: NotifyPayload): Promise<void> {
  if (userIds.length === 0) return;
  const rows = userIds.map((userId) => ({
    userId,
    titleAr: payload.titleAr,
    titleEn: payload.titleEn,
    messageAr: payload.messageAr,
    messageEn: payload.messageEn,
    channel: "in_app" as const,
    relatedEntityType: payload.relatedEntityType ?? null,
    relatedEntityId: payload.relatedEntityId ?? null,
    url: payload.url ?? null,
    sentBy: payload.sentBy ?? null,
    isRead: false,
  }));
  for (let i = 0; i < rows.length; i += DB_CHUNK) {
    await db.insert(notificationsTable).values(rows.slice(i, i + DB_CHUNK) as never);
  }
}

/**
 * Notify a single user: records an in-app row and fires a real push to all of
 * that user's devices in the user's preferred language.
 */
export async function notifyUser(opts: NotifyPayload & { userId: string }): Promise<void> {
  const { userId, ...payload } = opts;
  try {
    const [user] = await db
      .select({ id: usersTable.id, preferredLanguage: usersTable.preferredLanguage })
      .from(usersTable)
      .where(and(eq(usersTable.id, userId), isNull(usersTable.deletedAt)));
    if (!user) return;

    await insertInAppRows([userId], payload);

    const messages = await buildMessagesForRecipients(
      [{ userId, preferredLanguage: user.preferredLanguage }],
      payload,
    );
    // Fire-and-forget the push; never block or throw into the caller.
    void sendExpoPush(messages);
  } catch (err) {
    logger.error({ err, userId }, "notifyUser failed");
  }
}

/**
 * Notify a specific set of users. Records in-app rows and pushes to their
 * devices using each user's preferred language.
 */
export async function notifyManyUsers(userIds: Array<string>, payload: NotifyPayload): Promise<number> {
  try {
    const unique = [...new Set(userIds)];
    if (unique.length === 0) return 0;

    const recipients: Array<Recipient> = [];
    for (let i = 0; i < unique.length; i += DB_CHUNK) {
      const slice = unique.slice(i, i + DB_CHUNK);
      const rows = await db
        .select({ userId: usersTable.id, preferredLanguage: usersTable.preferredLanguage })
        .from(usersTable)
        .where(and(inArray(usersTable.id, slice), isNull(usersTable.deletedAt)));
      recipients.push(...rows);
    }
    if (recipients.length === 0) return 0;

    await insertInAppRows(recipients.map((r) => r.userId), payload);
    const messages = await buildMessagesForRecipients(recipients, payload);
    void sendExpoPush(messages);
    return recipients.length;
  } catch (err) {
    logger.error({ err }, "notifyManyUsers failed");
    return 0;
  }
}

/**
 * Notify every active, non-deleted user (broadcast). Records in-app rows and
 * pushes to all their devices, chunked, in each user's preferred language.
 */
export async function notifyAllActiveUsers(payload: NotifyPayload): Promise<number> {
  try {
    const recipients: Array<Recipient> = await db
      .select({ userId: usersTable.id, preferredLanguage: usersTable.preferredLanguage })
      .from(usersTable)
      .where(and(eq(usersTable.isActive, true), isNull(usersTable.deletedAt)));
    if (recipients.length === 0) return 0;

    await insertInAppRows(recipients.map((r) => r.userId), payload);
    const messages = await buildMessagesForRecipients(recipients, payload);
    void sendExpoPush(messages);
    return recipients.length;
  } catch (err) {
    logger.error({ err }, "notifyAllActiveUsers failed");
    return 0;
  }
}
