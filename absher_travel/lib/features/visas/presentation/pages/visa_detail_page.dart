import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_error_widget.dart';
import '../../../../core/widgets/loading_widget.dart';
import '../providers/visas_provider.dart';

class VisaDetailPage extends ConsumerWidget {
  final String id;
  const VisaDetailPage({super.key, required this.id});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final visaAsync = ref.watch(visaDetailProvider(id));

    return Directionality(
      textDirection: TextDirection.rtl,
      child: visaAsync.when(
        loading: () => const Scaffold(body: LoadingWidget()),
        error: (e, _) =>
            Scaffold(appBar: AppBar(), body: AppErrorWidget(message: e.toString())),
        data: (visa) => Scaffold(
          appBar: AppBar(title: Text(visa.displayName)),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _InfoRow(icon: Icons.location_on, label: 'الدولة', value: visa.country),
                _InfoRow(icon: Icons.category, label: 'نوع التأشيرة', value: visa.visaType),
                _InfoRow(
                  icon: Icons.schedule,
                  label: 'مدة المعالجة',
                  value: visa.processingDays != null ? '${visa.processingDays} أيام' : null,
                ),
                _InfoRow(
                  icon: Icons.attach_money,
                  label: 'الرسوم',
                  value: visa.fee != null ? '\$${visa.fee!.toStringAsFixed(0)}' : null,
                ),
                if (visa.displayDescription.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  Text('تفاصيل التأشيرة',
                      style: Theme.of(context).textTheme.headlineSmall),
                  const SizedBox(height: 8),
                  Text(visa.displayDescription,
                      style: Theme.of(context).textTheme.bodyMedium),
                ],
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.send),
                    label: const Text(AppStrings.applyVisa),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? value;

  const _InfoRow({required this.icon, required this.label, this.value});

  @override
  Widget build(BuildContext context) {
    if (value == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppColors.primary, size: 22),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Theme.of(context).textTheme.bodySmall),
              Text(value!, style: Theme.of(context).textTheme.titleMedium),
            ],
          ),
        ],
      ),
    );
  }
}
