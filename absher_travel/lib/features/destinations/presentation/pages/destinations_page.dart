import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/widgets/app_error_widget.dart';
import '../../../../core/widgets/loading_widget.dart';
import '../providers/destinations_provider.dart';
import '../widgets/destination_card.dart';

class DestinationsPage extends ConsumerWidget {
  const DestinationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final destinationsAsync = ref.watch(destinationsListProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(title: const Text(AppStrings.destinations)),
        body: destinationsAsync.when(
          loading: () => const LoadingWidget(),
          error: (e, _) => AppErrorWidget(
            message: e.toString(),
            onRetry: () => ref.invalidate(destinationsListProvider),
          ),
          data: (destinations) => destinations.isEmpty
              ? const Center(child: Text(AppStrings.noData))
              : GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.85,
                  ),
                  itemCount: destinations.length,
                  itemBuilder: (context, index) => SizedBox(
                    height: 200,
                    child: DestinationCard(destination: destinations[index]),
                  ),
                ),
        ),
      ),
    );
  }
}
