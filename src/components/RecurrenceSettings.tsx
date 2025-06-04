
import React, { useState } from 'react';
import { RecurrencePattern } from '../services/StorageService';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface RecurrenceSettingsProps {
  isRecurring: boolean;
  pattern?: RecurrencePattern;
  onRecurrenceChange: (isRecurring: boolean, pattern?: RecurrencePattern) => void;
}

export function RecurrenceSettings({ 
  isRecurring, 
  pattern, 
  onRecurrenceChange 
}: RecurrenceSettingsProps) {
  const [localPattern, setLocalPattern] = useState<RecurrencePattern>(
    pattern || { type: 'daily', interval: 1 }
  );

  const handleToggleRecurrence = (enabled: boolean) => {
    if (enabled) {
      onRecurrenceChange(true, localPattern);
    } else {
      onRecurrenceChange(false);
    }
  };

  const handlePatternChange = (newPattern: RecurrencePattern) => {
    setLocalPattern(newPattern);
    if (isRecurring) {
      onRecurrenceChange(true, newPattern);
    }
  };

  const handleDayToggle = (day: number, checked: boolean) => {
    const currentDays = localPattern.daysOfWeek || [];
    const updatedDays = checked 
      ? [...currentDays, day].sort((a, b) => a - b)
      : currentDays.filter(d => d !== day);
    
    const newPattern = { ...localPattern, daysOfWeek: updatedDays };
    handlePatternChange(newPattern);
  };

  const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="recurring-switch"
          checked={isRecurring}
          onCheckedChange={handleToggleRecurrence}
        />
        <Label htmlFor="recurring-switch">Повторяющаяся задача</Label>
      </div>

      {isRecurring && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Тип повтора</Label>
            <Select
              value={localPattern.type}
              onValueChange={(value: RecurrencePattern['type']) =>
                handlePatternChange({ ...localPattern, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Ежедневно</SelectItem>
                <SelectItem value="weekly">Еженедельно</SelectItem>
                <SelectItem value="weekdays">По будням</SelectItem>
                <SelectItem value="weekends">По выходным</SelectItem>
                <SelectItem value="custom">Настраиваемое</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {localPattern.type === 'daily' && (
            <div className="space-y-2">
              <Label>Повторять каждые (дней)</Label>
              <Input
                type="number"
                min="1"
                max="365"
                value={localPattern.interval || 1}
                onChange={(e) =>
                  handlePatternChange({
                    ...localPattern,
                    interval: parseInt(e.target.value) || 1
                  })
                }
              />
            </div>
          )}

          {localPattern.type === 'custom' && (
            <div className="space-y-2">
              <Label>Дни недели</Label>
              <div className="flex flex-wrap gap-2">
                {dayNames.map((day, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${index}`}
                      checked={localPattern.daysOfWeek?.includes(index) || false}
                      onCheckedChange={(checked) => 
                        handleDayToggle(index, checked as boolean)
                      }
                    />
                    <Label htmlFor={`day-${index}`} className="text-sm">
                      {day}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
