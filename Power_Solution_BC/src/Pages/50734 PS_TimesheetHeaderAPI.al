page 50734 "PS_TimesheetHeaderAPI"
{
    PageType = API;
    SourceTable = ARBVRNVeronaTimesheetHeader;
    APIPublisher = 'Power_Solution';
    APIGroup = 'PS_API';
    APIVersion = 'v2.0';
    EntityName = 'ResourceTimesheetHeader';
    EntitySetName = 'ResourceTimesheetHeaders';
    DelayedInsert = true;
    InsertAllowed = true;
    ModifyAllowed = true;
    DeleteAllowed = false;
    ODataKeyFields = "ARBVRNNo";


    layout
    {
        area(content)
        {
            repeater(Group)
            {
                field(resourceNoJobNo; Rec.ARBVRNResourceNoJobNo) { Editable = true; }
                field(no; Rec.ARBVRNNo) { Editable = true; }
                field(description; Rec.ARBVRNDescription) { Editable = true; }
                field(description2; Rec.ARBVRNDescription2) { Editable = true; }
                field(postingDate; Rec.ARBVRNPostingDate) { Editable = true; }
                field(postingDescription; Rec.ARBVRNPostingDescription) { Editable = true; }
                field(shortcutDimension1Code; Rec.ARBVRNShortcutDimension1Code) { Editable = true; }
                field(shortcutDimension2Code; Rec.ARBVRNShortcutDimension2Code) { Editable = true; }
                field(comment; Rec.ARBVRNComment) { Editable = true; }
                field(amount; Rec.ARBVRNAmount) { Editable = true; }
                field(reasonCode; Rec.ARBVRNReasonCode) { Editable = true; }
                field(noSeries; Rec.ARBVRNNoSeries) { Editable = true; }
                field(postingNoSeries; Rec.ARBVRNPostingNoSeries) { Editable = true; }
                field(dateFilter; Rec.ARBVRNDateFilter) { Editable = true; }
                field(timeSheetType; Rec.ARBVRNTimeSheetType) { Editable = true; }
                field(timeSheetDate; Rec.ARBVRNTimeSheetDate) { Editable = true; }
                field(allocationPeriod; Rec.ARBVRNAllocationPeriod) { Editable = true; }
                field(hoursQuantity; Rec.ARBVRNHoursQuantity) { Editable = true; }
                field(notcomputedHournumber; Rec.ARBVRNNotcomputedHournumber) { Editable = true; }
                field(machineryRental; Rec.ARBVRNMachineryRental) { Editable = true; }
                field(correctedTimeSheetNo; Rec.ARBVRNCorrectedTimeSheetNo) { Editable = true; }
                field(status; Rec.ARBVRNStatus) { Editable = true; }
                field(fromDate; Rec.ARBVRNFromDate) { Editable = true; }
                field(toDate; Rec.ARBVRNToDate) { Editable = true; }
                field(resourceCalendar; Rec.ARBVRNResourceCalendar) { Editable = true; }
                field(dimensionSetID; Rec.ARBVRNDimensionSetID) { Editable = true; }
                field(userIDWeb; Rec.ARBVRNUserIDWeb) { Editable = true; }
            }
        }
    }
}
