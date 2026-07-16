import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_error_widget.dart';
import '../../../../core/widgets/loading_widget.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../providers/bookings_provider.dart';

class BookingsPage extends ConsumerWidget {
  const BookingsPage({super.key});

  Color _statusColor(String status) {
    switch (status) {
      case 'confirmed': return AppColors.success;
      case 'pending': return AppColors.warning;
      case 'cancelled': return AppColors.error;
      case 'completed': return AppColors.info;
      default: return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateNotifierProvider);
    final isLoggedIn = authState.value?.isAuthenticated ?? false;

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(title: const Text(AppStrings.myBookings)),
        body: !isLoggedIn
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.login, size: 64, color: AppColors.textHint),
                    const SizedBox(height: 16),
                    const Text('يجب تسجيل الدخول لعرض حجوزاتك'),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: () => context.go('/login'),
                      child: const Text(AppStrings.login),
                    ),
                  ],
                ),
              )
            : Consumer(
                builder: (context, ref, _) {
                  final bookingsAsync = ref.watch(userBookingsProvider);
                  return bookingsAsync.when(
                    loading: () => const LoadingWidget(),
                    error: (e, _) => AppErrorWidget(
                      message: e.toString(),
                      onRetry: () => ref.invalidate(userBookingsProvider),
                    ),
                    data: (bookings) => bookings.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.book_outlined,
                                    size: 80, color: AppColors.textHint),
                                const SizedBox(height: 16),
                                const Text('لا توجد حجوزات بعد'),
                                const SizedBox(height: 20),
                                ElevatedButton(
                                  onPressed: () => context.go('/'),
                                  child: const Text('استكشف خدماتنا'),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: bookings.length,
                            itemBuilder: (context, index) {
                              final booking = bookings[index];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                child: ListTile(
                                  onTap: () =>
                                      context.go('/bookings/${booking.id}'),
                                  leading: Container(
                                    width: 48,
                                    height: 48,
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(Icons.book_online,
                                        color: AppColors.primary),
                                  ),
                                  title: Text(
                                    booking.referenceNumber ?? booking.id,
                                    style: Theme.of(context).textTheme.titleMedium,
                                  ),
                                  subtitle: Text(
                                    '${booking.bookingType ?? 'حجز'} • ${_formatDate(booking.createdAt)}',
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                                  trailing: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 10, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: _statusColor(booking.status)
                                              .withOpacity(0.15),
                                          borderRadius: BorderRadius.circular(20),
                                        ),
                                        child: Text(
                                          booking.statusAr,
                                          style: TextStyle(
                                            color: _statusColor(booking.status),
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ),
                                      if (booking.totalAmount != null)
                                        Text(
                                          '\$${booking.totalAmount!.toStringAsFixed(0)}',
                                          style: Theme.of(context)
                                              .textTheme
                                              .labelMedium
                                              ?.copyWith(
                                                color: AppColors.textSecondary,
                                              ),
                                        ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                  );
                },
              ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
