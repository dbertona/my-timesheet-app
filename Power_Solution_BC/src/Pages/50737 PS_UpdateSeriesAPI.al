page 50737 "PS_UpdateSeriesAPI"
{
    PageType = API;
    SourceTable = "No. Series Line";
    APIPublisher = 'powersolution';
    APIGroup = 'timesheet';
    APIVersion = 'v1.0';
    EntityName = 'updateSeries';
    EntitySetName = 'updateSeries';
    DelayedInsert = true;
    InsertAllowed = false;
    ModifyAllowed = true;
    DeleteAllowed = false;

    layout
    {
        area(content)
        {
            repeater(Group)
            {
                field(seriesCode; Rec."Series Code") { Editable = true; }
                field(lineNo; Rec."Line No.") { Editable = true; }
                field(startingDate; Rec."Starting Date") { Editable = true; }
                field(endingDate; Rec."Ending Date") { Editable = true; }
                field(startingNo; Rec."Starting No.") { Editable = true; }
                field(endingNo; Rec."Ending No.") { Editable = true; }
                field(lastDateUsed; Rec."Last Date Used") { Editable = true; }
                field(lastNoUsed; Rec."Last No. Used") { Editable = true; }
                field(warningNo; Rec."Warning No.") { Editable = true; }
                field(incrementByNo; Rec."Increment-by-No.") { Editable = true; }
                field(allowGapsInNos; Rec."Allow Gaps in Nos.") { Editable = true; }
                field(implementation; Rec."Implementation") { Editable = true; }
                field(open; Rec.Open) { Editable = true; }
            }
        }
    }

    trigger OnModifyRecord(): Boolean
    var
        NoSeriesLine: Record "No. Series Line";
    begin
        // Buscar la línea de serie existente
        NoSeriesLine.SetRange("Series Code", Rec."Series Code");
        NoSeriesLine.SetRange("Line No.", Rec."Line No.");
        NoSeriesLine.SetRange("Starting Date", Rec."Starting Date");
        
        if NoSeriesLine.FindFirst() then begin
            // Actualizar solo el Last No. Used
            NoSeriesLine."Last No. Used" := Rec."Last No. Used";
            NoSeriesLine."Last Date Used" := Rec."Last Date Used";
            NoSeriesLine.Modify(true);
            
            // Copiar el registro actualizado de vuelta
            Rec := NoSeriesLine;
        end;
        
        exit(true);
    end;
}
