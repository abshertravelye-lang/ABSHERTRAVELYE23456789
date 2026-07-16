import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_error_widget.dart';
import '../../../../core/widgets/loading_widget.dart';
import '../providers/programs_provider.dart';

class ProgramsPage extends ConsumerWidget {
  const ProgramsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final programsAsync = ref.watch(programsListProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(title: const Text(AppStrings.programs)),
        body: programsAsync.when(
          loading: () => const LoadingWidget(),
          error: (e, _) => AppErrorWidget(
            message: e.toString(),
            onRetry: () => ref.invalidate(programsListProvider),
          ),
          data: (programs) => programs.isEmpty
              ? const Center(child: Text(AppStrings.noData))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: programs.length,
                  itemBuilder: (context, index) {
                    final prog = programs[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 16),
                      child: InkWell(
                        onTap: () => context.go('/programs/${prog.id}'),
                        borderRadius: BorderRadius.circular(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (prog.imageUrl != null)
                              ClipRRect(
                                borderRadius: const BorderRadius.vertical(
                                    top: Radius.circular(16)),
                                child: Image.network(
                                  prog.imageUrl!,
                                  height: 160,
                                  width: double.infinity,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Container(
                                    height: 160,
                                    color: AppColors.primaryLight,
                                    child: const Icon(Icons.card_travel,
                                        color: AppColors.white, size: 48),
                                  ),
                                ),
                              ),
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(prog.displayTitle,
                                      style: Theme.of(context).textTheme.titleLarge),
                                  if (prog.destination != null) ...[
                                    const SizedBox(height: 4),
                                    Row(children: [
                                      const Icon(Icons.location_on,
                                          color: AppColors.accent, size: 16),
                                      const SizedBox(width: 4),
                                      Text(prog.destination!,
                                          style: Theme.of(context).textTheme.bodySmall),
                                    ]),
                                  ],
                                  const SizedBox(height: 12),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      if (prog.durationDays != null)
                                        Chip(
                                          avatar: const Icon(Icons.schedule, size: 16),
                                          label: Text('${prog.durationDays} ${AppStrings.days}'),
                                        ),
                                      if (prog.price != null)
                                        Text(
                                          '\$${prog.price!.toStringAsFixed(0)}',
                                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                                color: AppColors.accent,
                                                fontWeight: FontWeight.w800,
                                              ),
                                        ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ),
    );
  }
}
