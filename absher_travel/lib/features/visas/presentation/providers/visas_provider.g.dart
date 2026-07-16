// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'visas_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$visasListHash() => r'a75e5e43df7e1bd753fa408034ba1bb90d04dad4';

/// See also [visasList].
@ProviderFor(visasList)
final visasListProvider = AutoDisposeFutureProvider<List<VisaEntity>>.internal(
  visasList,
  name: r'visasListProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$visasListHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef VisasListRef = AutoDisposeFutureProviderRef<List<VisaEntity>>;
String _$visaDetailHash() => r'8eb3c2662fdfb84ef2a874533473425149ca29b1';

/// Copied from Dart SDK
class _SystemHash {
  _SystemHash._();

  static int combine(int hash, int value) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + value);
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x0007ffff & hash) << 10));
    return hash ^ (hash >> 6);
  }

  static int finish(int hash) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x03ffffff & hash) << 3));
    // ignore: parameter_assignments
    hash = hash ^ (hash >> 11);
    return 0x1fffffff & (hash + ((0x00003fff & hash) << 15));
  }
}

/// See also [visaDetail].
@ProviderFor(visaDetail)
const visaDetailProvider = VisaDetailFamily();

/// See also [visaDetail].
class VisaDetailFamily extends Family<AsyncValue<VisaEntity>> {
  /// See also [visaDetail].
  const VisaDetailFamily();

  /// See also [visaDetail].
  VisaDetailProvider call(
    String id,
  ) {
    return VisaDetailProvider(
      id,
    );
  }

  @override
  VisaDetailProvider getProviderOverride(
    covariant VisaDetailProvider provider,
  ) {
    return call(
      provider.id,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'visaDetailProvider';
}

/// See also [visaDetail].
class VisaDetailProvider extends AutoDisposeFutureProvider<VisaEntity> {
  /// See also [visaDetail].
  VisaDetailProvider(
    String id,
  ) : this._internal(
          (ref) => visaDetail(
            ref as VisaDetailRef,
            id,
          ),
          from: visaDetailProvider,
          name: r'visaDetailProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$visaDetailHash,
          dependencies: VisaDetailFamily._dependencies,
          allTransitiveDependencies:
              VisaDetailFamily._allTransitiveDependencies,
          id: id,
        );

  VisaDetailProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.id,
  }) : super.internal();

  final String id;

  @override
  Override overrideWith(
    FutureOr<VisaEntity> Function(VisaDetailRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: VisaDetailProvider._internal(
        (ref) => create(ref as VisaDetailRef),
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        id: id,
      ),
    );
  }

  @override
  AutoDisposeFutureProviderElement<VisaEntity> createElement() {
    return _VisaDetailProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is VisaDetailProvider && other.id == id;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, id.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin VisaDetailRef on AutoDisposeFutureProviderRef<VisaEntity> {
  /// The parameter `id` of this provider.
  String get id;
}

class _VisaDetailProviderElement
    extends AutoDisposeFutureProviderElement<VisaEntity> with VisaDetailRef {
  _VisaDetailProviderElement(super.provider);

  @override
  String get id => (origin as VisaDetailProvider).id;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
