import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_error_widget.dart';
import '../../../../core/widgets/loading_widget.dart';
import '../providers/programs_provider.dart';

class ProgramDetailPage extends ConsumerWidget {
  final String id;
  const ProgramDetailPage({super.key, required this.id});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final programAsync = ref.watch(programDetailProvider(id));

    return Directionality(
      textDirection: TextDirection.rtl,
      child: programAsync.when(
        loading: () => const Scaffold(body: LoadingWidget()),
        error: (e, _) =>
            Scaffold(appBar: AppBar(), body: AppErrorWidget(message: e.toString())),
        data: (prog) => Scaffold(
          body: CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 260,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  title: Text(prog.displayTitle,
                      style: const TextStyle(color: AppColors.white)),
                  background: prog.imageUrl != null
                      ? Image.network(prog.imageUrl!, fit: BoxFit.cover)
                      : Container(color: AppColors.primary),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          if (prog.durationDays != null)
                            Chip(
                              avatar: const Icon(Icons.schedule, size: 16),
                              label: Text('${prog.durationDays} ${AppStrings.days}'),
                            ),
                          const SizedBox(width: 12),
                          if (prog.price != null)
                            Text(
                              'من \$${prog.price!.toStringAsFixed(0)}',
                              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                    color: AppColors.accent,
                                    fontWeight: FontWeight.w800,
                                  ),
                            ),
                        ],
                      ),
                      if (prog.displayDescription.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        Text('تفاصيل البرنامج',
                            style: Theme.of(context).textTheme.headlineSmall),
                        const SizedBox(height: 8),
                        Text(prog.displayDescription,
                            style: Theme.of(context).textTheme.bodyMedium),
                      ],
                      const SizedBox(height: 32),
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: () {},
                          child: const Text(AppStrings.bookNow),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
