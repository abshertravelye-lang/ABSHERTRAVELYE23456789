import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_error_widget.dart';
import '../../../../core/widgets/loading_widget.dart';
import '../providers/bookings_provider.dart';

class BookingDetailPage extends ConsumerWidget {
  final String id;
  const BookingDetailPage({super.key, required this.id});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingAsync = ref.watch(bookingDetailProvider(id));

    return Directionality(
      textDirection: TextDirection.rtl,
      child: bookingAsync.when(
        loading: () => const Scaffold(body: LoadingWidget()),
        error: (e, _) =>
            Scaffold(appBar: AppBar(), body: AppErrorWidget(message: e.toString())),
        data: (booking) => Scaffold(
          appBar: AppBar(title: const Text('تفاصيل الحجز')),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('رقم الحجز',
                                style: Theme.of(context).textTheme.bodySmall),
                            Text(
                              booking.referenceNumber ?? booking.id,
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                          ],
                        ),
                        const Divider(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('الحالة',
                                style: Theme.of(context).textTheme.bodySmall),
                            Text(booking.statusAr,
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(
                                      color: AppColors.primary,
                                    )),
                          ],
                        ),
                        if (booking.totalAmount != null) ...[
                          const Divider(height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('المبلغ الإجمالي',
                                  style: Theme.of(context).textTheme.bodySmall),
                              Text(
                                '\$${booking.totalAmount!.toStringAsFixed(2)}',
                                style: Theme.of(context)
                                    .textTheme
                                    .titleLarge
                                    ?.copyWith(
                                      color: AppColors.accent,
                                      fontWeight: FontWeight.w800,
                                    ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                if (booking.notes != null && booking.notes!.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Text('ملاحظات',
                      style: Theme.of(context).textTheme.headlineSmall),
                  const SizedBox(height: 8),
                  Text(booking.notes!,
                      style: Theme.of(context).textTheme.bodyMedium),
                ],
                if (booking.status == 'pending') ...[
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: OutlinedButton(
                      onPressed: () {},
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppColors.error),
                        foregroundColor: AppColors.error,
                      ),
                      child: const Text(AppStrings.cancelled),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
