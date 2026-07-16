import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../features/auth/presentation/pages/login_page.dart';
import '../../features/auth/presentation/pages/register_page.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/home/presentation/pages/home_page.dart';
import '../../features/flights/presentation/pages/flights_search_page.dart';
import '../../features/flights/presentation/pages/flight_results_page.dart';
import '../../features/destinations/presentation/pages/destinations_page.dart';
import '../../features/destinations/presentation/pages/destination_detail_page.dart';
import '../../features/programs/presentation/pages/programs_page.dart';
import '../../features/programs/presentation/pages/program_detail_page.dart';
import '../../features/visas/presentation/pages/visas_page.dart';
import '../../features/visas/presentation/pages/visa_detail_page.dart';
import '../../features/offers/presentation/pages/offers_page.dart';
import '../../features/bookings/presentation/pages/bookings_page.dart';
import '../../features/bookings/presentation/pages/booking_detail_page.dart';
import '../../features/profile/presentation/pages/profile_page.dart';
import '../widgets/main_shell.dart';
import 'route_names.dart';

part 'app_router.g.dart';

@riverpod
GoRouter appRouter(Ref ref) {
  final authState = ref.watch(authStateNotifierProvider);

  return GoRouter(
    initialLocation: RouteNames.home,
    redirect: (context, state) {
      final isLoggedIn = authState.value?.isAuthenticated ?? false;
      final isAuthRoute = state.matchedLocation == RouteNames.login ||
          state.matchedLocation == RouteNames.register;

      if (!isLoggedIn && !isAuthRoute) {
        // Allow public routes
        final publicRoutes = [
          RouteNames.home,
          RouteNames.destinations,
          RouteNames.programs,
          RouteNames.visas,
          RouteNames.offers,
          RouteNames.flights,
        ];
        final isPublic = publicRoutes.any(
          (r) => state.matchedLocation.startsWith(r),
        );
        if (isPublic) return null;
        return RouteNames.login;
      }

      if (isLoggedIn && isAuthRoute) {
        return RouteNames.home;
      }

      return null;
    },
    routes: [
      // Auth routes (no shell)
      GoRoute(
        path: RouteNames.login,
        name: 'login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: RouteNames.register,
        name: 'register',
        builder: (context, state) => const RegisterPage(),
      ),

      // Main app with bottom nav shell
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(
            path: RouteNames.home,
            name: 'home',
            builder: (context, state) => const HomePage(),
          ),
          GoRoute(
            path: RouteNames.flights,
            name: 'flights',
            builder: (context, state) => const FlightsSearchPage(),
            routes: [
              GoRoute(
                path: 'results',
                name: 'flight-results',
                builder: (context, state) {
                  final extra = state.extra as Map<String, dynamic>? ?? {};
                  return FlightResultsPage(searchParams: extra);
                },
              ),
            ],
          ),
          GoRoute(
            path: RouteNames.destinations,
            name: 'destinations',
            builder: (context, state) => const DestinationsPage(),
            routes: [
              GoRoute(
                path: ':id',
                name: 'destination-detail',
                builder: (context, state) => DestinationDetailPage(
                  id: state.pathParameters['id']!,
                ),
              ),
            ],
          ),
          GoRoute(
            path: RouteNames.programs,
            name: 'programs',
            builder: (context, state) => const ProgramsPage(),
            routes: [
              GoRoute(
                path: ':id',
                name: 'program-detail',
                builder: (context, state) => ProgramDetailPage(
                  id: state.pathParameters['id']!,
                ),
              ),
            ],
          ),
          GoRoute(
            path: RouteNames.visas,
            name: 'visas',
            builder: (context, state) => const VisasPage(),
            routes: [
              GoRoute(
                path: ':id',
                name: 'visa-detail',
                builder: (context, state) => VisaDetailPage(
                  id: state.pathParameters['id']!,
                ),
              ),
            ],
          ),
          GoRoute(
            path: RouteNames.offers,
            name: 'offers',
            builder: (context, state) => const OffersPage(),
          ),
          GoRoute(
            path: RouteNames.bookings,
            name: 'bookings',
            builder: (context, state) => const BookingsPage(),
            routes: [
              GoRoute(
                path: ':id',
                name: 'booking-detail',
                builder: (context, state) => BookingDetailPage(
                  id: state.pathParameters['id']!,
                ),
              ),
            ],
          ),
          GoRoute(
            path: RouteNames.profile,
            name: 'profile',
            builder: (context, state) => const ProfilePage(),
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('الصفحة غير موجودة: ${state.error}'),
      ),
    ),
  );
}
