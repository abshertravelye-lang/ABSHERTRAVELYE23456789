import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_strings.dart';
import '../../../../core/theme/app_colors.dart';

class FlightsSearchPage extends ConsumerStatefulWidget {
  const FlightsSearchPage({super.key});

  @override
  ConsumerState<FlightsSearchPage> createState() => _FlightsSearchPageState();
}

class _FlightsSearchPageState extends ConsumerState<FlightsSearchPage> {
  final _fromCtrl = TextEditingController();
  final _toCtrl = TextEditingController();
  DateTime? _departureDate;
  DateTime? _returnDate;
  int _adults = 1;
  String _tripType = 'roundTrip';
  String _cabinClass = 'economy';

  @override
  void dispose() {
    _fromCtrl.dispose();
    _toCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate(bool isDeparture) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        if (isDeparture) {
          _departureDate = picked;
        } else {
          _returnDate = picked;
        }
      });
    }
  }

  void _search() {
    if (_fromCtrl.text.isEmpty || _toCtrl.text.isEmpty || _departureDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('يرجى ملء جميع الحقول المطلوبة')),
      );
      return;
    }
    context.go('/flights/results', extra: {
      'from': _fromCtrl.text,
      'to': _toCtrl.text,
      'departure': _departureDate!.toIso8601String(),
      'returnDate': _returnDate?.toIso8601String(),
      'adults': _adults,
      'cabinClass': _cabinClass,
      'tripType': _tripType,
    });
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        body: CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 140,
              pinned: true,
              backgroundColor: AppColors.primary,
              flexibleSpace: FlexibleSpaceBar(
                title: Text(AppStrings.searchFlights,
                    style: const TextStyle(color: AppColors.white)),
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppColors.primaryDark, AppColors.primary],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Trip Type
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Row(
                          children: [
                            Expanded(
                              child: RadioListTile<String>(
                                title: Text(AppStrings.roundTrip,
                                    style: Theme.of(context).textTheme.bodyMedium),
                                value: 'roundTrip',
                                groupValue: _tripType,
                                onChanged: (v) => setState(() => _tripType = v!),
                                contentPadding: EdgeInsets.zero,
                                dense: true,
                              ),
                            ),
                            Expanded(
                              child: RadioListTile<String>(
                                title: Text(AppStrings.oneWay,
                                    style: Theme.of(context).textTheme.bodyMedium),
                                value: 'oneWay',
                                groupValue: _tripType,
                                onChanged: (v) => setState(() => _tripType = v!),
                                contentPadding: EdgeInsets.zero,
                                dense: true,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // From / To
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            TextField(
                              controller: _fromCtrl,
                              textDirection: TextDirection.rtl,
                              decoration: InputDecoration(
                                labelText: AppStrings.from,
                                prefixIcon: const Icon(Icons.flight_takeoff,
                                    color: AppColors.primary),
                                hintText: 'المدينة أو المطار',
                              ),
                            ),
                            const Divider(height: 24),
                            TextField(
                              controller: _toCtrl,
                              textDirection: TextDirection.rtl,
                              decoration: InputDecoration(
                                labelText: AppStrings.to,
                                prefixIcon: const Icon(Icons.flight_land,
                                    color: AppColors.accent),
                                hintText: 'المدينة أو المطار',
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Dates
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Expanded(
                              child: _DateSelector(
                                label: AppStrings.departure,
                                date: _departureDate,
                                icon: Icons.calendar_today,
                                onTap: () => _pickDate(true),
                              ),
                            ),
                            if (_tripType == 'roundTrip') ...[
                              const SizedBox(width: 12),
                              Expanded(
                                child: _DateSelector(
                                  label: AppStrings.returnDate,
                                  date: _returnDate,
                                  icon: Icons.event_available,
                                  onTap: () => _pickDate(false),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Passengers & Class
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(AppStrings.passengers,
                                      style: Theme.of(context).textTheme.bodySmall),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      IconButton(
                                        onPressed: _adults > 1
                                            ? () => setState(() => _adults--)
                                            : null,
                                        icon: const Icon(Icons.remove_circle_outline),
                                        color: AppColors.primary,
                                      ),
                                      Text('$_adults',
                                          style: Theme.of(context).textTheme.titleLarge),
                                      IconButton(
                                        onPressed: _adults < 9
                                            ? () => setState(() => _adults++)
                                            : null,
                                        icon: const Icon(Icons.add_circle_outline),
                                        color: AppColors.primary,
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('الدرجة',
                                      style: Theme.of(context).textTheme.bodySmall),
                                  const SizedBox(height: 4),
                                  DropdownButton<String>(
                                    value: _cabinClass,
                                    isExpanded: true,
                                    underline: const SizedBox.shrink(),
                                    onChanged: (v) => setState(() => _cabinClass = v!),
                                    items: const [
                                      DropdownMenuItem(
                                          value: 'economy',
                                          child: Text(AppStrings.economy)),
                                      DropdownMenuItem(
                                          value: 'business',
                                          child: Text(AppStrings.business)),
                                      DropdownMenuItem(
                                          value: 'first',
                                          child: Text(AppStrings.firstClass)),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton.icon(
                        onPressed: _search,
                        icon: const Icon(Icons.search),
                        label: const Text('بحث عن رحلات'),
                        style: ElevatedButton.styleFrom(
                          textStyle: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DateSelector extends StatelessWidget {
  final String label;
  final DateTime? date;
  final IconData icon;
  final VoidCallback onTap;

  const _DateSelector({
    required this.label,
    required this.date,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.border),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Icon(icon, color: AppColors.primary, size: 18),
                const SizedBox(width: 8),
                Text(
                  date != null
                      ? '${date!.day}/${date!.month}/${date!.year}'
                      : 'اختر التاريخ',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: date != null
                            ? AppColors.textPrimary
                            : AppColors.textHint,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
