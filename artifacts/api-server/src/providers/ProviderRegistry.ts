import type { IFlightProvider } from "./_base/IFlightProvider";
import { AmadeusProvider } from "./amadeus/AmadeusProvider";

class ProviderRegistryClass {
  private flightProviders: Map<string, IFlightProvider> = new Map();

  constructor() {
    // Register built-in providers here
    this.registerFlight(new AmadeusProvider());
    // Future: this.registerFlight(new SkyscannerProvider());
    // Future: this.registerFlight(new DuffelProvider());
  }

  registerFlight(provider: IFlightProvider): void {
    this.flightProviders.set(provider.slug, provider);
  }

  getFlightProvider(slug: string): IFlightProvider | undefined {
    return this.flightProviders.get(slug);
  }

  getActiveFlightProviders(): IFlightProvider[] {
    return [...this.flightProviders.values()].filter((p) => p.isAvailable());
  }

  getAllFlightProviders(): IFlightProvider[] {
    return [...this.flightProviders.values()];
  }
}

// Singleton
export const ProviderRegistry = new ProviderRegistryClass();
