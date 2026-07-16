// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'programs_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$programsListHash() => r'1b356f9747871fd33f9cfc11228ac238d9a6eaeb';

/// See also [programsList].
@ProviderFor(programsList)
final programsListProvider =
    AutoDisposeFutureProvider<List<ProgramEntity>>.internal(
  programsList,
  name: r'programsListProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$programsListHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef ProgramsListRef = AutoDisposeFutureProviderRef<List<ProgramEntity>>;
String _$programDetailHash() => r'4140f241558bd0403d41e533aa061e7b0d45595a';

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

/// See also [programDetail].
@ProviderFor(programDetail)
const programDetailProvider = ProgramDetailFamily();

/// See also [programDetail].
class ProgramDetailFamily extends Family<AsyncValue<ProgramEntity>> {
  /// See also [programDetail].
  const ProgramDetailFamily();

  /// See also [programDetail].
  ProgramDetailProvider call(
    String id,
  ) {
    return ProgramDetailProvider(
      id,
    );
  }

  @override
  ProgramDetailProvider getProviderOverride(
    covariant ProgramDetailProvider provider,
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
  String? get name => r'programDetailProvider';
}

/// See also [programDetail].
class ProgramDetailProvider extends AutoDisposeFutureProvider<ProgramEntity> {
  /// See also [programDetail].
  ProgramDetailProvider(
    String id,
  ) : this._internal(
          (ref) => programDetail(
            ref as ProgramDetailRef,
            id,
          ),
          from: programDetailProvider,
          name: r'programDetailProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$programDetailHash,
          dependencies: ProgramDetailFamily._dependencies,
          allTransitiveDependencies:
              ProgramDetailFamily._allTransitiveDependencies,
          id: id,
        );

  ProgramDetailProvider._internal(
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
    FutureOr<ProgramEntity> Function(ProgramDetailRef provider) create,
  ) {
    return ProviderOverride(
      origin: this,
      override: ProgramDetailProvider._internal(
        (ref) => create(ref as ProgramDetailRef),
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
  AutoDisposeFutureProviderElement<ProgramEntity> createElement() {
    return _ProgramDetailProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is ProgramDetailProvider && other.id == id;
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
mixin ProgramDetailRef on AutoDisposeFutureProviderRef<ProgramEntity> {
  /// The parameter `id` of this provider.
  String get id;
}

class _ProgramDetailProviderElement
    extends AutoDisposeFutureProviderElement<ProgramEntity>
    with ProgramDetailRef {
  _ProgramDetailProviderElement(super.provider);

  @override
  String get id => (origin as ProgramDetailProvider).id;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
