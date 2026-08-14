/**
 * One-off normalization: rewrite stored country values to canonical English
 * names from @workspace/countries, so eligibility exact-match works.
 *
 * Run: cd artifacts/api-server && npx tsx scripts/normalize-countries.ts
 */
import { db, pool, usersTable, visasTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { canonicalCountryEn } from "@workspace/countries";

const canon = (v: string | null | undefined): string | null | undefined => {
  if (!v) return v;
  return canonicalCountryEn(v) ?? v; // keep unrecognized values as-is
};

const canonList = (list: string[] | null | undefined): string[] =>
  (list ?? []).map((v) => canonicalCountryEn(v) ?? v);

async function main() {
  let userUpdates = 0;
  const users = await db.select().from(usersTable);
  for (const u of users) {
    const next = {
      nationality: canon(u.nationality),
      gccResidenceCountry: canon(u.gccResidenceCountry),
      passportIssueCountry: canon(u.passportIssueCountry),
    };
    if (
      next.nationality !== u.nationality ||
      next.gccResidenceCountry !== u.gccResidenceCountry ||
      next.passportIssueCountry !== u.passportIssueCountry
    ) {
      await db.update(usersTable).set(next as never).where(eq(usersTable.id, u.id));
      userUpdates++;
      console.log(
        `user ${u.id}: nationality "${u.nationality}"→"${next.nationality}", gcc "${u.gccResidenceCountry}"→"${next.gccResidenceCountry}", passportIssue "${u.passportIssueCountry}"→"${next.passportIssueCountry}"`,
      );
    }
  }

  let visaUpdates = 0;
  const visas = await db.select().from(visasTable);
  for (const v of visas) {
    const next = {
      allowedNationalities: canonList(v.allowedNationalities),
      blockedNationalities: canonList(v.blockedNationalities),
      acceptedGccCountries: canonList((v as unknown as { acceptedGccCountries?: string[] }).acceptedGccCountries),
    };
    const changed =
      JSON.stringify(next.allowedNationalities) !== JSON.stringify(v.allowedNationalities ?? []) ||
      JSON.stringify(next.blockedNationalities) !== JSON.stringify(v.blockedNationalities ?? []) ||
      JSON.stringify(next.acceptedGccCountries) !==
        JSON.stringify((v as unknown as { acceptedGccCountries?: string[] }).acceptedGccCountries ?? []);
    if (changed) {
      await db.update(visasTable).set(next as never).where(eq(visasTable.id, v.id));
      visaUpdates++;
      console.log(`visa ${v.id}: normalized country lists`);
    }
  }

  console.log(`Done. Updated ${userUpdates} user(s), ${visaUpdates} visa(s).`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
