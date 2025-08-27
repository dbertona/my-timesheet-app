page 50720 "PS Planned Billing Filter"
{
    PageType = Card;
    ApplicationArea = Jobs;
    Caption = 'Planned Billing Filtering';
    AdditionalSearchTerms = 'Planification, Billing';
    Editable = true;
    UsageCategory = Lists;

    layout
    {
        area(content)
        {

            field("Year Filter"; YearFilter)
            {
                ApplicationArea = All;
                Caption = 'Year';
                ToolTip = 'Select the year to filter by.';
                Editable = true;
                TableRelation = "PS_Year"."PS_Year";
                trigger OnValidate()
                begin
                    CurrPage.MyListPart.PAGE.SetYear(YearFilter);
                end;
            }

            group(Facturación)
            {
                Caption = 'Facturación';
                part(MyListPart; "PS Planned billing")
                {
                    //ApplicationArea = Jobs;
                    //Caption = '';
                }
            }
            group(Total)
            {
                Caption = '';
                part(MyListPartTotal; "PS Planned billing Totals")
                {
                    //ApplicationArea = Jobs;
                    //Caption = '';
                }
            }
        }
    }

    var
        YearFilter: Integer;
        PS_UniqueJobPlanningRec: Record "PS_UniqueJobPlanningMatriz";

    trigger OnOpenPage()
    begin
        PS_UniqueJobPlanningRec.DeleteAll();
    end;
}
