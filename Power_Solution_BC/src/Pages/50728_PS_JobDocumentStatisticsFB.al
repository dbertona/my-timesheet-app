page 50728 PSJobDocumentStatisticsFB

{
    Caption = 'Purchase/sales statistics';
    Editable = false;
    LinksAllowed = false;
    PageType = CardPart;
    SourceTable = Job;

    layout
    {
        area(content)
        {
            field("No."; Rec."No.")
            {
                ApplicationArea = Jobs;
                Caption = 'Project No.';
                ToolTip = 'Specifies the project number.';

                trigger OnDrillDown()
                begin
                    ShowDetails();
                end;
            }
            cuegroup(Control23)
            {
                ShowCaption = false;
                field(PSNumberofInvoicesIssued; Rec."PS_NumberofInvoicesIssued")
                {
                    ApplicationArea = Basic, Suite;
                    Caption = 'Posted sales invoice';
                }
                field(ARBVRNPostedSalesCrMemoDoc; Rec."PS_NumberofCrInvoicesIssued")
                {
                    ApplicationArea = Basic, Suite;
                    Caption = 'Posted sales cr.memo';
                }
                field(ARBVRNCertificationDoc; Rec."ARBVRNCertificationDoc")
                {
                    ApplicationArea = SalesReturnOrder;
                    Caption = 'Certifications';
                    DrillDownPageID = "ARBVRNCertificationList";
                }
                field(ARBVRNPostedCertificationDoc; Rec."ARBVRNPostedCertificationDoc")
                {
                    ApplicationArea = Basic, Suite;
                    Caption = 'Posted Certifications';
                }
                field(ARBVRNPurchOrderDoc; Rec."PS_NumberofPurchaseOrders")
                {
                    ApplicationArea = Basic, Suite;
                    Caption = 'Purchase Orders';
                    DrillDownPageID = "Purchase Order List";
                }
                field(ARBVRNPostedPurchInvoiceDoc; Rec."PS_NumberofPurchaseInvoice")
                {
                    ApplicationArea = Basic, Suite;
                    Caption = 'Posted purchase invoice';
                }
                field(ARBVRNPostedPurchCrMemoDoc1; Rec."PS_NumberofCRPurchaseIssued")
                {
                    ApplicationArea = Basic, Suite;
                    Caption = 'Posted purchase cr.memo';
                }
            }
        }
    }

    actions
    {
    }

    local procedure ShowDetails()
    begin
        PAGE.Run(PAGE::"Customer Card", Rec);
    end;
}

