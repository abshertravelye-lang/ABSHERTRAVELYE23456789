import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../destinations/presentation/providers/destinations_provider.dart';
import '../../../destinations/presentation/widgets/destination_card.dart';

class PopularDestinationsSection extends ConsumerWidget {
  const PopularDestinationsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final destinationsAsync = ref.watch(destinationsListProvider);

    return SizedBox(
      height: 180,
      child: destinationsAsync.when(
        loading: () => ListView.builder(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: 3,
          itemBuilder: (_, __) => Container(
            width: 160,
            margin: const EdgeInsets.only(right: 12),
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
        error: (_, __) => const Center(child: Text('لا توجد وجهات')),
        data: (destinations) {
          if (destinations.isEmpty) {
            return const Center(child: Text('لا توجد وجهات متاحة'));
          }
          return ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: destinations.length > 6 ? 6 : destinations.length,
            itemBuilder: (context, index) =>
                DestinationCard(destination: destinations[index]),
          );
        },
      ),
    );
  }
}
