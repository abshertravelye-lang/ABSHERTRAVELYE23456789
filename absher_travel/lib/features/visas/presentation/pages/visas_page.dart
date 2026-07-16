import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_error_widget.dart';
import '../../../../core/widgets/loading_widget.dart';
import '../providers/visas_provider.dart';

class VisasPage extends ConsumerWidget {
  const VisasPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final visasAsync = ref.watch(visasListProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(title: const Text(AppStrings.visas)),
        body: visasAsync.when(
          loading: () => const LoadingWidget(),
          error: (e, _) => AppErrorWidget(
            message: e.toString(),
            onRetry: () => ref.invalidate(visasListProvider),
          ),
          data: (visas) => visas.isEmpty
              ? const Center(child: Text(AppStrings.noData))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: visas.length,
                  itemBuilder: (context, index) {
                    final visa = visas[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        onTap: () => context.go('/visas/${visa.id}'),
                        leading: Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.article_outlined,
                              color: AppColors.primary),
                        ),
                        title: Text(visa.displayName,
                            style: Theme.of(context).textTheme.titleMedium),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (visa.country != null)
                              Row(children: [
                                const Icon(Icons.location_on,
                                    color: AppColors.accent, size: 14),
                                const SizedBox(width: 4),
                                Text(visa.country!),
                              ]),
                            if (visa.processingDays != null)
                              Text('المعالجة: ${visa.processingDays} أيام',
                                  style:
                                      Theme.of(context).textTheme.bodySmall),
                          ],
                        ),
                        trailing: visa.fee != null
                            ? Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    '\$${visa.fee!.toStringAsFixed(0)}',
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(
                                          color: AppColors.accent,
                                          fontWeight: FontWeight.w800,
                                        ),
                                  ),
                                ],
                              )
                            : null,
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}
