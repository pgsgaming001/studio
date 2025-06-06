"use client";
import type React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface DeliveryAddressProps {
  address: Address;
  setAddress: (address: Address) => void;
}

export function DeliveryAddress({ address, setAddress }: DeliveryAddressProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="street" className="flex items-center space-x-2 mb-1">
            <MapPin size={16} className="text-primary"/>
            <span className="font-medium">Street Address</span>
        </Label>
        <Input id="street" name="street" value={address.street} onChange={handleChange} placeholder="123 Main St" required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city" className="font-medium">City</Label>
          <Input id="city" name="city" value={address.city} onChange={handleChange} placeholder="Anytown" required />
        </div>
        <div>
          <Label htmlFor="state" className="font-medium">State / Province</Label>
          <Input id="state" name="state" value={address.state} onChange={handleChange} placeholder="CA" required />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="zip" className="font-medium">ZIP / Postal Code</Label>
          <Input id="zip" name="zip" value={address.zip} onChange={handleChange} placeholder="90210" required />
        </div>
        <div>
          <Label htmlFor="country" className="font-medium">Country</Label>
          <Input id="country" name="country" value={address.country} onChange={handleChange} placeholder="USA" required />
        </div>
      </div>
    </div>
  );
}
