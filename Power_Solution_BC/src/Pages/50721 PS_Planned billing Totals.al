page 50721 "PS Planned billing Totals"
{
    PageType = ListPart;
    ApplicationArea = Jobs;
    Caption = 'Total';
    Editable = False;
    SourceTable = "PS_UniqueJobPlanningMatriz";
    QueryCategory = 'Job List';

    layout
    {
        area(content)
        {
            repeater("Project Data")
            {
                field("Job No."; Rec."Job No.")
                {
                    ApplicationArea = All;
                    Caption = 'No.';
                    Editable = True;

                }
                field("Description"; Rec."Description")
                {
                    ApplicationArea = All;
                    Caption = 'Description';
                }

                // Definir los campos para los meses
                field("January"; Rec."JanInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'January';
                }

                field("February"; Rec."FebInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'February';
                }

                field("March"; Rec."MarInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'March';
                }

                field("April"; Rec."AprInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'April';
                }

                field("May"; Rec."MayInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'May';
                }

                field("June"; Rec."JunInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'June';
                }

                field("July"; Rec."JulInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'July';
                }

                field("August"; Rec."AugInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'August';
                }

                field("September"; Rec."SepInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'September';
                }

                field("October"; Rec."OctInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'October';
                }

                field("November"; Rec."NovInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'November';
                }

                field("December"; Rec."DecInvoice")
                {
                    ApplicationArea = All;
                    Caption = 'December';
                }
            }

            // Alinear los totales con los meses en el mismo layout
        }
    }

    trigger OnOpenPage()
    begin
        // Filtrar para mostrar solo el registro donde "Job No." sea 'Total'
        Rec.SetRange("Job No.", 'Total');
    end;
}
