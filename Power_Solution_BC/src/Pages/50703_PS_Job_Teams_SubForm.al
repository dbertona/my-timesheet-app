/// <summary>
/// Page PS_ARBVRNJobTeamSubform (ID 50703).
/// </summary>
page 50703 PS_Job_Teams_SubForm
{
    Caption = 'Job Teams Subform';
    DataCaptionFields = "ARBVRNJobNo";
    PageType = ListPart;
    SaveValues = true;
    SourceTable = "ARBVRNJobTeam";

    layout
    {
        area(content)
        {
            repeater(Control1)
            {
                //IndentationColumn = DescriptionIndent;
                //IndentationControls = Description;
                ShowCaption = false;
                field("Job No."; Rec."ARBVRNJobNo")
                {
                    ApplicationArea = Basic, Suite, Jobs;
                    Style = Strong;
                    StyleExpr = StyleIsStrong;
                    ToolTip = 'Specifies the number of the related job.';
                    Visible = false;
                }
                field("Resource"; Rec."ARBVRNResourceNo")
                {
                    ApplicationArea = Basic, Suite, Jobs;
                    Style = Strong;
                    StyleExpr = StyleIsStrong;
                    ToolTip = 'Specifies the number of the Resource.';
                }
                field(Name; Rec.ARBVRNResourceName)
                {
                    ApplicationArea = Basic, Suite, Jobs;
                    Style = Strong;
                    StyleExpr = StyleIsStrong;
                    ToolTip = 'Specifies the name of the Recource.';
                }
                field("Solo Imputar"; Rec.PS_SoloImputar)
                {
                    ApplicationArea = All;
                    Visible = true;
                    Editable = True;
                }
            }
        }
    }

    //   trigger OnAfterGetRecord()
    //   begin
    //       DescriptionIndent := Rec.Indentation;
    //       StyleIsStrong := Rec."Job Task Type" <> "Job Task Type"::Posting;
    //  end;

    //    trigger OnNewRecord(BelowxRec: Boolean)
    //    begin
    //        Rec.ClearTempDim();
    //        StyleIsStrong := Rec."Job Task Type" <> "Job Task Type"::Posting;
    //    end;

    var
        DescriptionIndent: Integer;
        StyleIsStrong: Boolean;

    [IntegrationEvent(true, false)]
    local procedure OnBeforeOnActionJobPlanningLines(var JobTask: Record "Job Task"; var IsHandled: Boolean);
    begin
    end;

    [IntegrationEvent(true, false)]
    local procedure OnBeforeOnDrillDownOutstandingOrders(var JobTask: Record "Job Task"; var IsHandled: Boolean);
    begin
    end;

    [IntegrationEvent(true, false)]
    local procedure OnBeforeOnDrillDownAmtRcdNotInvoiced(var JobTask: Record "Job Task"; var IsHandled: Boolean);
    begin
    end;
}

