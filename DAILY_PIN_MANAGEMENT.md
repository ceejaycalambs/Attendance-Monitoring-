# Daily PIN Management Guide

## Overview
Super admins can now create and manage daily security PINs for officers. PINs can be created for:
- **Specific dates** (per day)
- **Specific events** (optional - can be general or event-specific)
- **Specific officers** (by email)
- **Specific roles** (ROTC Staff or USC Council)

## Setup

### Step 1: Run Database Migration
Add the `event_id` field to the `daily_pins` table:

Go to **Supabase Dashboard → SQL Editor** and run:

```sql
-- Add event_id to daily_pins table
ALTER TABLE public.daily_pins
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE;

-- Update the unique constraint to include event_id
ALTER TABLE public.daily_pins
DROP CONSTRAINT IF EXISTS daily_pins_email_pin_valid_date_role_key;

ALTER TABLE public.daily_pins
ADD CONSTRAINT daily_pins_email_pin_valid_date_role_event_key 
UNIQUE (email, pin, valid_date, role, event_id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_pins_event_id ON public.daily_pins(event_id);
CREATE INDEX IF NOT EXISTS idx_daily_pins_valid_date ON public.daily_pins(valid_date);
```

Or run the entire file: `supabase/migrations/ADD_EVENT_TO_DAILY_PINS.sql`

### Step 2: Access PIN Management
1. Log in as super admin
2. Go to **Admin** section in the sidebar
3. Click **"PIN Management"**

## Features

### Create Daily PIN
1. **Officer Email**: Enter the email of the officer
2. **PIN**: Enter a 4-digit PIN
3. **Valid Date**: Select the date this PIN is valid for
4. **Officer Type**: Select ROTC Staff or USC Council
5. **Event** (Optional): 
   - Leave as "General (No Event)" for a general daily PIN
   - Or select a specific event to create an event-specific PIN

### View Existing PINs
- See all created PINs in a table
- View email, PIN, date, role, and associated event
- Delete PINs if needed

### PIN Usage
Officers can use their PIN to:
- Log in to the scanner using email + PIN
- Access the scanner for the specific date
- If event-specific, the PIN is valid only for that event on that date

## Important Notes

1. **Unique Constraint**: Each combination of (email, pin, valid_date, role, event_id) must be unique
2. **Event-Specific PINs**: If you create a PIN for a specific event, it's only valid for that event on that date
3. **General PINs**: If you leave event blank, the PIN is valid for any event on that date
4. **Updating PINs**: If a PIN already exists for the same combination, it will be updated instead of creating a duplicate

## Example Use Cases

### General Daily PIN
- Create a PIN for an officer for today
- Leave event blank
- Officer can use it for any event today

### Event-Specific PIN
- Create a PIN for "Spring Festival 2025" event
- Officer can only use this PIN for that specific event
- Useful when different events need different security levels

### Multiple PINs
- Same officer can have different PINs for different events on the same day
- Same officer can have different PINs for different dates

