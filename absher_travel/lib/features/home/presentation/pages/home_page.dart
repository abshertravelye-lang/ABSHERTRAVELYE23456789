import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../widgets/home_hero_section.dart';
import '../widgets/services_grid.dart';
import '../widgets/featured_offers_section.dart';
import '../widgets/popular_destinations_section.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateNotifierProvider);

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: CustomScrollView(
          slivers: [
            // App Bar
            SliverAppBar(
              expandedHeight: 200,
              floating: false,
              pinned: true,
              backgroundColor: AppColors.primary,
              flexibleSpace: FlexibleSpaceBar(
                background: HomeHeroSection(
                  userName: authState.value?.user?.displayName,
                ),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.notifications_outlined,
                      color: AppColors.white),
                  onPressed: () {},
                ),
                const SizedBox(width: 8),
              ],
            ),

            // Content
            SliverToBoxAdapter(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 24),

                  // Services
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Text(
                      AppStrings.ourServices,
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const ServicesGrid(),

                  const SizedBox(height: 28),

                  // Featured Offers
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(AppStrings.featuredOffers,
                            style:
                                Theme.of(context).textTheme.headlineSmall),
                        TextButton(
                          onPressed: () => context.go(RouteNames.offers),
                          child: const Text('عرض الكل'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  const FeaturedOffersSection(),

                  const SizedBox(height: 28),

                  // Popular Destinations
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(AppStrings.popularDestinations,
                            style:
                                Theme.of(context).textTheme.headlineSmall),
                        TextButton(
                          onPressed: () => context.go(RouteNames.destinations),
                          child: const Text('عرض الكل'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  const PopularDestinationsSection(),

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
