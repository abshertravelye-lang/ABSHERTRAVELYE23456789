import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateNotifierProvider);
    final user = authState.value?.user;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 220,
              pinned: true,
              backgroundColor: AppColors.primary,
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppColors.primaryDark, AppColors.primary],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                  child: SafeArea(
                    child: user != null
                        ? Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const SizedBox(height: 40),
                              CircleAvatar(
                                radius: 44,
                                backgroundColor: AppColors.accent,
                                child: Text(
                                  user.displayName.isNotEmpty
                                      ? user.displayName[0].toUpperCase()
                                      : 'م',
                                  style: const TextStyle(
                                    fontSize: 36,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.primaryDark,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              Text(user.displayName,
                                  style: const TextStyle(
                                    color: AppColors.white,
                                    fontSize: 20,
                                    fontWeight: FontWeight.w700,
                                  )),
                              if (user.email != null)
                                Text(user.email!,
                                    style: TextStyle(
                                      color: AppColors.white.withOpacity(0.7),
                                      fontSize: 13,
                                    )),
                            ],
                          )
                        : const Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              SizedBox(height: 40),
                              CircleAvatar(
                                radius: 44,
                                backgroundColor: AppColors.accent,
                                child: Icon(Icons.person,
                                    size: 44, color: AppColors.primaryDark),
                              ),
                              SizedBox(height: 12),
                              Text('مرحباً بك',
                                  style: TextStyle(
                                      color: AppColors.white,
                                      fontSize: 20,
                                      fontWeight: FontWeight.w700)),
                            ],
                          ),
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: user != null
                    ? _LoggedInMenu(ref: ref)
                    : _GuestMenu(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LoggedInMenu extends StatelessWidget {
  final WidgetRef ref;
  const _LoggedInMenu({required this.ref});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _MenuCard(items: [
          _MenuItem(
            icon: Icons.book_outlined,
            label: AppStrings.myBookings,
            onTap: () => context.go(RouteNames.bookings),
          ),
          _MenuItem(
            icon: Icons.notifications_outlined,
            label: AppStrings.notifications,
            onTap: () {},
          ),
          _MenuItem(
            icon: Icons.person_outline,
            label: 'تعديل الملف الشخصي',
            onTap: () {},
          ),
        ]),
        const SizedBox(height: 16),
        _MenuCard(items: [
          _MenuItem(
            icon: Icons.language,
            label: AppStrings.language,
            trailing: const Text('العربية'),
            onTap: () {},
          ),
          _MenuItem(
            icon: Icons.info_outline,
            label: AppStrings.about,
            onTap: () {},
          ),
          _MenuItem(
            icon: Icons.phone_outlined,
            label: AppStrings.contact,
            onTap: () {},
          ),
        ]),
        const SizedBox(height: 16),
        _MenuCard(items: [
          _MenuItem(
            icon: Icons.logout,
            label: AppStrings.logout,
            color: AppColors.error,
            onTap: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('تسجيل الخروج'),
                  content: const Text('هل تريد تسجيل الخروج من حسابك؟'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx, false),
                      child: const Text('إلغاء'),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(ctx, true),
                      style: TextButton.styleFrom(foregroundColor: AppColors.error),
                      child: const Text('خروج'),
                    ),
                  ],
                ),
              );
              if (confirmed == true) {
                await ref.read(authStateNotifierProvider.notifier).logout();
              }
            },
          ),
        ]),
      ],
    );
  }
}

class _GuestMenu extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const Icon(Icons.person_add_outlined,
                    size: 56, color: AppColors.primary),
                const SizedBox(height: 12),
                const Text('سجّل دخولك للوصول إلى حسابك'),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => context.go(RouteNames.login),
                    child: const Text(AppStrings.login),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () => context.go(RouteNames.register),
                    child: const Text(AppStrings.register),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        _MenuCard(items: [
          _MenuItem(icon: Icons.info_outline, label: AppStrings.about, onTap: () {}),
          _MenuItem(icon: Icons.phone_outlined, label: AppStrings.contact, onTap: () {}),
        ]),
      ],
    );
  }
}

class _MenuCard extends StatelessWidget {
  final List<_MenuItem> items;
  const _MenuCard({required this.items});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: items.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value;
          return Column(
            children: [
              ListTile(
                onTap: item.onTap,
                leading: Icon(item.icon,
                    color: item.color ?? AppColors.primary, size: 22),
                title: Text(item.label,
                    style: Theme.of(context).textTheme.titleSmall?.copyWith(
                          color: item.color ?? AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                        )),
                trailing: item.trailing ??
                    Icon(Icons.arrow_forward_ios,
                        size: 14, color: AppColors.textSecondary),
              ),
              if (index < items.length - 1)
                const Divider(height: 1, indent: 56),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class _MenuItem {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;
  final Widget? trailing;

  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color,
    this.trailing,
  });
}
