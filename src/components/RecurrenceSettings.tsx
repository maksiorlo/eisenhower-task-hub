
import React from 'react';
import { RecurrencePattern } from '../services/StorageService';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Repeat } from 'lucide-react';

interface RecurrenceSettingsProps {
  isRecurring: boolean;
  pattern?: RecurrencePattern;
  onRecurrenceChange: (isRecurring: boolean, pattern?: RecurrencePattern) => void;
}

export function RecurrenceSettings({ isRecurring, pattern, onRecurrenceChange }: RecurrenceSettingsProps) {
  const [localPattern, setLocalPattern] = React.useState<RecurrencePattern>(
    pattern || { type: 'daily', interval: 1 }
  );

  const handleToggleRecurrence = () => {
    const newRecurring = !isRecurring;
    onRecurrenceChange(newRecurring, newRecurring ? localPattern : undefined);
  };

  const handlePatternChange = (newPattern: RecurrencePattern) => {
    setLocalPattern(newPattern);
    if (isRecurring) {
      onRecurrenceChange(true, newPattern);
    }
  };

  const daysOfWeek = [
    { value: 0, label: 'Вс' },
    { value: 1, label: 'Пн' },
    { value: 2, label: 'Вт' },
    { value: 3, label: 'Ср' },
    { value: 4, label: 'Чт' },
    { value: 5, label: 'Пт' },
    { value: 6, label: 'Сб' },
  ];

  const getRecurrenceDisplay = () => {
    if (!isRecurring) return null;
    
    switch (localPattern.type) {
      case 'daily':
        return localPattern.interval === 1 ? 'ежедневно' : `каждые ${localPattern.interval} дня`;
      case 'weekly':
        return 'еженедельно';
      case 'weekdays':
        return 'по будням';
      case 'weekends':
        return 'по выходным';
      case 'custom':
        const selectedDays = localPattern.daysOfWeek?.map(day => 
          daysOfWeek.find(d => d.value === day)?.label
        ).join(', ');
        return selectedDays ? `по: ${selectedDays}` : 'настраиваемое';
      default:
        return 'повтор';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={isRecurring}
          onCheckedChange={handleToggleRecurrence}
        />
        <div className="flex items-center gap-1">
          <Repeat className="h-3 w-3" />
          <span className="text-xs text-gray-600">
            {isRecurring ? getRecurrenceDisplay() : 'Повторять задачу'}
          </span>
        </div>
      </div>

      {isRecurring && (
        <div className="ml-5 space-y-2">
          <Select
            value={localPattern.type}
            onValueChange={(value: RecurrencePattern['type']) =>
              handlePatternChange({ ...localPattern, type: value })
            }
          >
            <SelectTrigger className="w-full h-7 text-xs">
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

          {localPattern.type === 'daily' && (
            <div className="flex items-center gap-2">
              <span className="text-xs">Каждые</span>
              <Input
                type="number"
                min="1"
                max="365"
                value={localPattern.interval || 1}
                onChange={(e) =>
                  handlePatternChange({
                    ...localPattern,
                    interval: parseInt(e.target.value) || 1,
                  })
                }
                className="w-16 h-6 text-xs"
              />
              <span className="text-xs">дня</span>
            </div>
          )}

          {localPattern.type === 'custom' && (
            <div className="grid grid-cols-7 gap-1">
              {daysOfWeek.map((day) => (
                <Button
                  key={day.value}
                  variant={
                    localPattern.daysOfWeek?.includes(day.value) ? 'default' : 'outline'
                  }
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => {
                    const currentDays = localPattern.daysOfWeek || [];
                    const newDays = currentDays.includes(day.value)
                      ? currentDays.filter((d) => d !== day.value)
                      : [...currentDays, day.value];
                    handlePatternChange({ ...localPattern, daysOfWeek: newDays });
                  }}
                >
                  {day.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
