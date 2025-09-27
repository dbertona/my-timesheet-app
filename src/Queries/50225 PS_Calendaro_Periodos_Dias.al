query 50225 PS_Calendaro_Periodos_Dias
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'CalendaroPeriodosDias';
    EntitySetName = 'CalendaroPeriodosDias';
    QueryType = API;

    elements
    {
        dataitem(calendarPeriodDay; "ARBVRNAllocationPeriodDays")
        {
            column(allocation_period; ARBVRNAllocationPeriod) { }
            column(calendar_code; ARBVRNCalendar) { }
            column(day; ARBVRNDay) { }
            column(holiday; ARBVRNHoliday) { }
            column(hours_working; ARBVRNHoursWorking) { }
            column(lastModifiedDateTime; SystemModifiedAt) { }
        }
    }

    trigger OnBeforeOpen()
    begin
    end;
}
