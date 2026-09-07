'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const getHolidaysForYear = (year) => {
  return [
    // Fixed Date Holidays
    { date: `${year}-01-01`, name: 'New Year\'s Day', color: '#10b981' },
    { date: `${year}-01-13`, name: 'Lohri', color: '#64748b' },
    { date: `${year}-01-14`, name: 'Makar Sankranti / Pongal', color: '#10b981' },
    { date: `${year}-01-15`, name: 'Thiruvalluvar Day', color: '#64748b' },
    { date: `${year}-01-23`, name: 'Netaji Subhas Chandra Bose Jayanti', color: '#64748b' },
    { date: `${year}-01-26`, name: 'Republic Day', color: '#10b981' },
    { date: `${year}-02-19`, name: 'Shivaji Jayanti', color: '#64748b' },
    { date: `${year}-04-14`, name: 'Ambedkar Jayanti / Vaisakhi / Vishu', color: '#64748b' },
    { date: `${year}-05-01`, name: 'Labour Day / Maharashtra Day', color: '#64748b' },
    { date: `${year}-05-09`, name: 'Rabindranath Tagore Jayanti', color: '#64748b' },
    { date: `${year}-08-15`, name: 'Independence Day', color: '#10b981' },
    { date: `${year}-10-02`, name: 'Gandhi Jayanti', color: '#10b981' },
    { date: `${year}-12-25`, name: 'Christmas Day', color: '#10b981' },
    { date: `${year}-12-31`, name: 'New Year\'s Eve', color: '#10b981' },
    
    // Dynamic/Lunar/Regional Holidays (Approximate for 2026)
    ...(year === 2026 ? [
      { date: '2026-01-24', name: 'Basant Panchami / Vasant Panchami', color: '#64748b' },
      { date: '2026-02-14', name: 'Maha Shivaratri', color: '#10b981' },
      { date: '2026-03-03', name: 'Holi / Dolyatra', color: '#10b981' },
      { date: '2026-03-19', name: 'Chaitra Sukladi / Gudi Padwa / Ugadi', color: '#64748b' },
      { date: '2026-03-20', name: 'Eid al-Fitr (Ramzan Id)', color: '#10b981' },
      { date: '2026-03-21', name: 'Cheti Chand', color: '#64748b' },
      { date: '2026-03-28', name: 'Ram Navami', color: '#10b981' },
      { date: '2026-03-30', name: 'Mahavir Jayanti', color: '#10b981' },
      { date: '2026-04-03', name: 'Good Friday', color: '#10b981' },
      { date: '2026-04-05', name: 'Easter Sunday', color: '#10b981' },
      { date: '2026-05-27', name: 'Eid al-Adha (Bakrid)', color: '#10b981' },
      { date: '2026-05-31', name: 'Buddha Purnima', color: '#10b981' },
      { date: '2026-06-17', name: 'Muharram (Ashura)', color: '#10b981' },
      { date: '2026-08-25', name: 'First Day of Onam', color: '#64748b' },
      { date: '2026-08-26', name: 'Thiruvonam (Onam)', color: '#64748b' },
      { date: '2026-08-28', name: 'Raksha Bandhan', color: '#10b981' },
      { date: '2026-09-04', name: 'Janmashtami (Smarta)', color: '#10b981' },
      { date: '2026-09-14', name: 'Ganesh Chaturthi / Vinayaka Chaturthi', color: '#10b981' },
      { date: '2026-10-18', name: 'Dussehra (Vijayadashami)', color: '#10b981' },
      { date: '2026-10-31', name: 'Karva Chauth', color: '#10b981' },
      { date: '2026-11-08', name: 'Diwali (Deepavali)', color: '#10b981' },
      { date: '2026-11-09', name: 'Govardhan Puja', color: '#10b981' },
      { date: '2026-11-10', name: 'Bhai Dooj', color: '#10b981' },
      { date: '2026-11-15', name: 'Chhath Puja', color: '#10b981' },
      { date: '2026-11-24', name: 'Guru Nanak Jayanti', color: '#10b981' },
    ] : []),
  ];
};

export default function HolidayCalendar() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const holidays = getHolidaysForYear(currentYear);

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Build calendar grid
  const gridDays = [];
  
  // Previous month trailing days
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);
  for (let i = 0; i < firstDay; i++) {
    gridDays.push({
      day: prevMonthDays - firstDay + i + 1,
      isCurrentMonth: false,
      monthOffset: -1
    });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    gridDays.push({
      day: i,
      isCurrentMonth: true,
      monthOffset: 0
    });
  }
  
  // Next month leading days (to fill 42 cells grid = 6 rows)
  const remainingCells = 42 - gridDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    gridDays.push({
      day: i,
      isCurrentMonth: false,
      monthOffset: 1
    });
  }

  const isToday = (day, monthOffset) => {
    const today = new Date();
    const cellDate = new Date(currentYear, currentMonth + monthOffset, day);
    return (
      today.getDate() === cellDate.getDate() &&
      today.getMonth() === cellDate.getMonth() &&
      today.getFullYear() === cellDate.getFullYear()
    );
  };

  const getHolidayForDay = (day, monthOffset) => {
    const cellDate = new Date(currentYear, currentMonth + monthOffset, day);
    // Format YYYY-MM-DD
    const dateStr = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`;
    return holidays.find(h => h.date === dateStr);
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>
      <div 
        style={{
          width: '100%',
          maxWidth: '1000px',
          height: '100%',
          maxHeight: '850px',
          margin: '0 auto',
          background: isDark ? '#0A0E17' : '#ffffff',
          borderRadius: '16px',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`,
          padding: '16px',
          boxShadow: isDark ? '0 4px 6px rgba(0,0,0,0.1)' : '0 4px 6px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0
        }}
      >
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexShrink: 0, gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '700', 
              color: isDark ? '#ffffff' : '#0f172a',
              margin: 0
            }}>
              {monthNames[currentMonth]} {currentYear}
            </h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={goToToday}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                background: 'transparent',
                color: isDark ? '#cbd5e1' : '#475569',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              Today
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button 
                onClick={prevMonth}
                style={{
                  width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'transparent',
                  color: isDark ? '#cbd5e1' : '#475569',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <ChevronLeft size={20} />
              </button>
              
              <button 
                onClick={nextMonth}
                style={{
                  width: '36px', height: '36px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'transparent',
                  color: isDark ? '#cbd5e1' : '#475569',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minHeight: 0 }}>
          
          {/* Days Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', flexShrink: 0 }}>
            {dayNames.map((dayName, idx) => (
              <div 
                key={dayName}
                style={{
                  padding: '8px',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: isDark ? '#94a3b8' : '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {dayName}
              </div>
            ))}
          </div>
          
          {/* Days Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)', 
            gridTemplateRows: 'repeat(6, minmax(0, 1fr))',
            gap: '6px',
            flex: 1,
            minHeight: 0
          }}>
            {gridDays.map((cell, idx) => {
              const today = isToday(cell.day, cell.monthOffset);
              const holiday = getHolidayForDay(cell.day, cell.monthOffset);
              
              return (
                <div 
                  key={idx}
                  style={{
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    padding: '4px 6px',
                    background: cell.isCurrentMonth 
                      ? (isDark ? '#111827' : '#ffffff')
                      : (isDark ? '#0A0E17' : '#f8fafc'),
                    opacity: cell.isCurrentMonth ? 1 : 0.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    transition: 'all 0.2s',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div 
                      style={{
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        fontSize: '12px',
                        fontWeight: today ? '700' : '600',
                        color: today 
                          ? '#ffffff' 
                          : (isDark ? '#e2e8f0' : '#334155'),
                        background: today ? '#10b981' : 'transparent',
                      }}
                    >
                      {cell.day}
                    </div>
                  </div>
                  
                  {/* Events Container */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                    {holiday && (
                      <div
                        style={{
                          background: `${holiday.color}15`,
                          borderLeft: `3px solid ${holiday.color}`,
                          color: isDark ? '#ffffff' : '#0f172a',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600',
                          lineHeight: 1.1,
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '4px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                        }}
                      >
                        <div style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: holiday.color,
                          flexShrink: 0,
                          marginTop: '3px'
                        }} />
                        <span style={{ 
                          whiteSpace: 'normal', 
                          wordBreak: 'break-word',
                          display: 'block'
                        }}>
                          {holiday.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
