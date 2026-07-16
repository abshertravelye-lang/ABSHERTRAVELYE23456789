// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'destinations_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$destinationsListHash() => r'015bcf332ec46117bfaac4aacfeb5d50036b7204';

/// See also [destinationsList].
@ProviderFor(destinationsList)
final destinationsListProvider =
    AutoDisposeFutureProvider<List<DestinationEntity>>.internal(
  destinationsList,
  name: r'destinationsListProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$destinationsListHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef DestinationsListRef
    = AutoDisposeFutureProviderRef<List<DestinationEntity>>;
String _$destinationDetailHash() => r'faf95fab58875953857df4ca641abd1c9bc71dc4';

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

/// See also [destinationDetail].
@ProviderFor(destinationDetail)
const destinationDetailProvider = DestinationDetailFamily();

/// See also [destinationDetail].
class DestinationDetailFamily extends Family<AsyncValue<DestinationEntity>> {
  /// See also [destinationDetail].
  const DestinationDetailFamily();

  /// See also [destinationDetail].
  DestinationDetailProvider call(
    String id,
  ) {
    return DestinationDetailProvider(
      id,
    );
  }

  @override
  DestinationDetailProvider getProviderOverride(
    covariant DestinationDetailProvider provider,
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
  String? get name => r'destinationDetailProvider';
}

/// See also [destinationDetail].
class DestinationDetailProvider
    extends AutoDisposeFutureProvider<DestinationEntity> {
  /// See also [destinationDetail].
  DestinationDetailProvider(
    String id,
  ) : this._internal(
          (ref) => destinationDetail(
            ref as DestinationDetailRef,
            id,
          ),
          from: destinationDetailProvider,
          name: r'destinationDetailProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$destinationDetailHash,
          dependencies: DestinationDetailFamily._dependencies,
          allTransitiveDependencies:
              DestinationDetailFamily._allTransitiveDependencies,
          id: id,
        );

  DestinationDetailProvider._internal(
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
    FutureOr<DestinationEntity> Function(DestinationDetailRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: DestinationDetailProvider._internal(
        (ref) => create(ref as DestinationDetailRef),
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
  AutoDisposeFutureProviderElement<DestinationEntity> createElement() {
    return _DestinationDetailProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is DestinationDetailProvider && other.id == id;
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
mixin DestinationDetailRef on AutoDisposeFutureProviderRef<DestinationEntity> {
  /// The parameter `id` of this provider.
  String get id;
}

class _DestinationDetailProviderElement
    extends AutoDisposeFutureProviderElement<DestinationEntity>
    with DestinationDetailRef {
  _DestinationDetailProviderElement(super.provider);

  @override
  String get id => (origin as DestinationDetailProvider).id;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
