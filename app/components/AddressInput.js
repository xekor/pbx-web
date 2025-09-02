'use client';

import { useEffect, useRef, useState } from 'react';

export default function AddressInput({ 
  value = {}, 
  onChange, 
  placeholder = "Enter address", 
  required = false,
  className = "" 
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Add global CSS for Google Places styling
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .pac-container {
        border-radius: 8px !important;
        border: 1px solid #d1d5db !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        margin-top: 4px !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-size: 14px !important;
      }
      
      .pac-item {
        padding: 12px 16px !important;
        border-bottom: 1px solid #f3f4f6 !important;
        cursor: pointer !important;
        transition: background-color 0.2s !important;
        line-height: 1.4 !important;
      }
      
      .pac-item:hover {
        background-color: #f9fafb !important;
      }
      
      .pac-item:last-child {
        border-bottom: none !important;
      }
      
      .pac-item-query {
        font-size: 14px !important;
        font-weight: 500 !important;
        color: #111827 !important;
      }
      
      .pac-matched {
        font-weight: 600 !important;
        color: #3b82f6 !important;
      }
      
      .pac-item-query .pac-matched {
        font-weight: 600 !important;
      }
      
      .pac-secondary-text {
        font-size: 12px !important;
        color: #6b7280 !important;
        margin-top: 2px !important;
      }
      
      .pac-icon {
        margin-right: 12px !important;
        margin-top: 2px !important;
      }
      
      /* Hide any Google Places pac-container that might appear */
      .pac-container {
        display: none !important;
        visibility: hidden !important;
      }
    `;
    
    if (!document.querySelector('#google-places-custom-styles')) {
      style.id = 'google-places-custom-styles';
      document.head.appendChild(style);
    }
    
    return () => {
      const existingStyle = document.querySelector('#google-places-custom-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  // Initialize Google Places API
  useEffect(() => {
    const initializeAutocomplete = () => {
      if (!window.google?.maps?.places) {
        return false;
      }

      // Skip the original Google Autocomplete since we're using manual implementation
      setIsLoaded(true);
      console.log('Using manual autocomplete implementation');
      return true;
    };

    // Simple loading approach to avoid conflicts
    if (!window.google) {
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
        script.async = true;
        
        script.onload = () => {
          console.log('Google Maps script loaded successfully');
          console.log('Google available:', !!window.google);
          console.log('Google Maps available:', !!window.google?.maps);
          console.log('Google Places available:', !!window.google?.maps?.places);
          // Wait a bit for Google to fully initialize
          setTimeout(initializeAutocomplete, 500);
        };
        
        script.onerror = (error) => {
          console.error('Error loading Google Maps API:', error);
          console.error('Check: 1) API key validity, 2) Places API enabled, 3) Billing setup, 4) Domain restrictions');
        };
        
        document.head.appendChild(script);
      } else {
        // Script exists, check periodically if Google is loaded
        const checkInterval = setInterval(() => {
          if (initializeAutocomplete()) {
            clearInterval(checkInterval);
          }
        }, 500);
        
        // Clear after 10 seconds
        setTimeout(() => clearInterval(checkInterval), 10000);
      }
    } else {
      initializeAutocomplete();
    }

    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        try {
          window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        } catch (error) {
          console.error('Error cleaning up autocomplete:', error);
        }
      }
    };
  }, []);

  // Update input value when value prop changes
  useEffect(() => {
    if (value.address && value.city && value.state) {
      setInputValue(`${value.address}, ${value.city}, ${value.state} ${value.zip || ''}`.trim());
    } else {
      setInputValue('');
    }
  }, [value]);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current.getPlace();
    console.log('Place selected:', place);
    
    if (!place.address_components) {
      console.log('No address components found');
      return;
    }

    const addressComponents = place.address_components;
    const addressData = {
      address: '',
      city: '',
      state: '',
      zip: '',
      country: ''
    };

    // Parse address components
    addressComponents.forEach(component => {
      const types = component.types;
      console.log('Component:', component.long_name, 'Types:', types);
      
      if (types.includes('street_number')) {
        addressData.address = component.long_name;
      } else if (types.includes('route')) {
        addressData.address = `${addressData.address} ${component.long_name}`.trim();
      } else if (types.includes('locality')) {
        addressData.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        addressData.state = component.short_name;
      } else if (types.includes('postal_code')) {
        addressData.zip = component.long_name;
      } else if (types.includes('country')) {
        addressData.country = component.short_name;
      }
    });

    console.log('Parsed address data:', addressData);

    // Update the input display value
    setInputValue(place.formatted_address);

    // Call onChange with parsed address
    if (onChange) {
      onChange(addressData);
    }
  };

  const fetchSuggestions = (input) => {
    if (window.google?.maps?.places && input.length >= 3) {
      const service = new window.google.maps.places.AutocompleteService();
      service.getPlacePredictions({
        input: input,
        componentRestrictions: { country: 'us' }
      }, (predictions, status) => {
        if (predictions && status === 'OK') {
          setManualSuggestions(predictions.slice(0, 5));
        } else {
          setManualSuggestions([]);
        }
      });
    } else {
      setManualSuggestions([]);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Fetch new suggestions as user types
    if (showManualDropdown) {
      fetchSuggestions(newValue);
    }
    
    // If user clears the input, clear the address data
    if (newValue === '') {
      if (onChange) {
        onChange({
          address: '',
          city: '',
          state: '',
          zip: '',
          country: ''
        });
      }
      setManualSuggestions([]);
    }
  };

  const handleManualEntry = () => {
    // If Google API didn't load, allow manual entry
    if (!isLoaded) {
      const parts = inputValue.split(',').map(part => part.trim());
      if (parts.length >= 3) {
        const addressData = {
          address: parts[0] || '',
          city: parts[1] || '',
          state: parts[2]?.split(' ')[0] || '',
          zip: parts[2]?.split(' ')[1] || '',
          country: 'US'
        };
        
        if (onChange) {
          onChange(addressData);
        }
      }
    }
  };

  // Create manual dropdown for testing
  const [showManualDropdown, setShowManualDropdown] = useState(false);
  const [manualSuggestions, setManualSuggestions] = useState([]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => {
          setShowManualDropdown(true);
          // Only fetch suggestions if there's enough text in the input
          if (inputValue.length >= 3) {
            fetchSuggestions(inputValue);
          }
        }}
        onBlur={() => setTimeout(() => setShowManualDropdown(false), 200)}
        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
        placeholder={placeholder}
        required={required}
      />
      
      {/* Manual dropdown for testing */}
      {showManualDropdown && manualSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
          {manualSuggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => {
                setInputValue(suggestion.description);
                setShowManualDropdown(false);
                // Trigger place selection manually
                if (window.google?.maps?.places) {
                  const service = new window.google.maps.places.PlacesService(document.createElement('div'));
                  service.getDetails({
                    placeId: suggestion.place_id,
                    fields: ['address_components', 'formatted_address']
                  }, (place, status) => {
                    if (place && place.address_components) {
                      const addressData = { address: '', city: '', state: '', zip: '', country: '' };
                      place.address_components.forEach(component => {
                        const types = component.types;
                        if (types.includes('street_number')) {
                          addressData.address = component.long_name;
                        } else if (types.includes('route')) {
                          addressData.address = `${addressData.address} ${component.long_name}`.trim();
                        } else if (types.includes('locality')) {
                          addressData.city = component.long_name;
                        } else if (types.includes('administrative_area_level_1')) {
                          addressData.state = component.short_name;
                        } else if (types.includes('postal_code')) {
                          addressData.zip = component.long_name;
                        }
                      });
                      if (onChange) onChange(addressData);
                    }
                  });
                }
              }}
            >
              <div className="font-medium text-gray-900">{suggestion.structured_formatting?.main_text || suggestion.description}</div>
              {suggestion.structured_formatting?.secondary_text && (
                <div className="text-sm text-gray-500">{suggestion.structured_formatting.secondary_text}</div>
              )}
            </div>
          ))}
        </div>
      )}
      
      
      
    </div>
  );
}