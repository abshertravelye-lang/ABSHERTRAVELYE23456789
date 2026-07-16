import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_error_widget.dart';
import '../../../../core/widgets/loading_widget.dart';
import '../providers/destinations_provider.dart';

class DestinationDetailPage extends ConsumerWidget {
  final String id;
  const DestinationDetailPage({super.key, required this.id});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final destAsync = ref.watch(destinationDetailProvider(id));

    return Directionality(
      textDirection: TextDirection.rtl,
      child: destAsync.when(
        loading: () => const Scaffold(body: LoadingWidget()),
        error: (e, _) => Scaffold(
          appBar: AppBar(),
          body: AppErrorWidget(message: e.toString()),
        ),
        data: (dest) => Scaffold(
          body: CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 260,
                pinned: true,
                flexibleSpace: FlexibleSpaceBar(
                  title: Text(dest.displayName,
                      style: const TextStyle(color: AppColors.white)),
                  background: dest.imageUrl != null
                      ? Image.network(dest.imageUrl!, fit: BoxFit.cover)
                      : Container(color: AppColors.primary),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (dest.country != null) ...[
                        Row(children: [
                          const Icon(Icons.location_on, color: AppColors.accent, size: 20),
                          const SizedBox(width: 6),
                          Text(dest.country!,
                              style: Theme.of(context).textTheme.titleMedium),
                        ]),
                        const SizedBox(height: 16),
                      ],
                      if (dest.displayDescription.isNotEmpty) ...[
                        Text('عن الوجهة',
                            style: Theme.of(context).textTheme.headlineSmall),
                        const SizedBox(height: 8),
                        Text(dest.displayDescription,
                            style: Theme.of(context).textTheme.bodyMedium),
                      ],
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
