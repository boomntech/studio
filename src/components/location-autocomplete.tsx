
'use client';

import { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    google: any;
    googleMapsCallback: () => void;
  }
}

export function LocationAutocomplete() {
  const { setValue, trigger } = useFormContext();
  const { toast } = useToast();
  const autocompleteInputRef = useRef<HTMLInputElement>(null);

  const initializeAutocomplete = () => {
    if (!autocompleteInputRef.current || !window.google) return;
    
    const autocomplete = new window.google.maps.places.Autocomplete(
      autocompleteInputRef.current,
      { types: ['(cities)'] }
    );

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (!place || !place.address_components) {
        toast({
          variant: 'destructive',
          title: 'Location not recognized',
          description: 'Please select a valid location from the suggestions.',
        });
        return;
      }
      
      // Clear previous values
      setValue('city', '', { shouldValidate: false });
      setValue('state', '', { shouldValidate: false });
      setValue('country', '', { shouldValidate: false });

      let city = '';
      let state = '';
      let country = '';

      for (const component of place.address_components) {
        const types = component.types;
        if (types.includes('locality')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          state = component.long_name;
        } else if (types.includes('country')) {
          country = component.long_name;
        }
      }
      
      setValue('city', city, { shouldDirty: true });
      setValue('state', state, { shouldDirty: true });
      setValue('country', country, { shouldDirty: true });
      
      // Trigger validation for all location fields after setting them
      trigger(['city', 'state', 'country']);

      if (autocompleteInputRef.current) {
        autocompleteInputRef.current.value = ''; // Clear search input after selection
      }
    });
  };

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key is missing.');
      return;
    }

    if (window.google?.maps?.places) {
        initializeAutocomplete();
        return;
    }

    // Use a unique callback name to avoid conflicts
    const callbackName = 'googleMapsCallback';
    window[callbackName] = initializeAutocomplete;

    if (!document.querySelector(`script[src*="maps.googleapis.com"]`)) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }

    return () => {
      // Don't remove the script to avoid issues with HMR and other components that might use it
      // But we can clean up the callback
      if(window[callbackName]) {
        delete window[callbackName];
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Input
      ref={autocompleteInputRef}
      placeholder="Start typing your city to autofill..."
      id="location-autocomplete"
    />
  );
}
