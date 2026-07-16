import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/router/route_names.dart';
import '../../../../core/theme/app_colors.dart';

class _ServiceItem {
  final IconData icon;
  final String label;
  final String route;
  final Color color;

  const _ServiceItem({
    required this.icon,
    required this.label,
    required this.route,
    required this.color,
  });
}

class ServicesGrid extends StatelessWidget {
  const ServicesGrid({super.key});

  static const _services = [
    _ServiceItem(
      icon: Icons.flight,
      label: 'الرحلات',
      route: RouteNames.flights,
      color: Color(0xFF3B82F6),
    ),
    _ServiceItem(
      icon: Icons.map_outlined,
      label: 'الوجهات',
      route: RouteNames.destinations,
      color: Color(0xFF10B981),
    ),
    _ServiceItem(
      icon: Icons.card_travel,
      label: 'البرامج',
      route: RouteNames.programs,
      color: Color(0xFF8B5CF6),
    ),
    _ServiceItem(
      icon: Icons.article_outlined,
      label: 'التأشيرات',
      route: RouteNames.visas,
      color: Color(0xFFF59E0B),
    ),
    _ServiceItem(
      icon: Icons.local_offer_outlined,
      label: 'العروض',
      route: RouteNames.offers,
      color: Color(0xFFEF4444),
    ),
    _ServiceItem(
      icon: Icons.book_online_outlined,
      label: 'حجوزاتي',
      route: RouteNames.bookings,
      color: Color(0xFF06B6D4),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1,
        ),
        itemCount: _services.length,
        itemBuilder: (context, index) {
          final service = _services[index];
          return _ServiceCard(service: service);
        },
      ),
    );
  }
}

class _ServiceCard extends StatelessWidget {
  final _ServiceItem service;
  const _ServiceCard({required this.service});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.go(service.route),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppColors.shadow,
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: service.color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(service.icon, color: service.color, size: 26),
            ),
            const SizedBox(height: 8),
            Text(
              service.label,
              style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
