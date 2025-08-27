/// <summary>
/// Unknown Microsoft.
/// </summary>

page 50702 "Bank conciliation"
{
    AdditionalSearchTerms = 'Bank, conciliation';
    ApplicationArea = Basic, Suite;
    UsageCategory = Lists;
    Caption = 'Bank conciliation';
    Editable = false;
    PageType = List;
    SourceTable = "Bank Account Ledger Entry";
    SourceTableView = sorting("Posting Date") order(descending);

    layout
    {
        area(content)
        {
            repeater(Control1)
            {
                ShowCaption = false;

                field("Bank Account No."; Rec."Bank Account No.")
                {
                    ApplicationArea = Basic, Suite;
                    ToolTip = 'Specifies the number of the bank account for this ledger entry.';
                }
                field("Description"; Rec.Description)
                {
                    ApplicationArea = Basic, Suite;
                    ToolTip = 'Specifies the description of the bank ledger entry.';
                }
                field("Statement No."; Rec."Statement No.")
                {
                    ApplicationArea = Basic, Suite;
                    ToolTip = 'Specifies the statement number related to this ledger entry.';
                }
                field("Amount"; Rec.Amount)
                {
                    ApplicationArea = Basic, Suite;
                    ToolTip = 'Specifies the transaction amount.';

                }
                field("Tipo de cta."; Rec."Bal. Account Type")
                {
                    ApplicationArea = Basic, Suite;
                    Caption = 'Tipo de cta.';
                    ToolTip = 'Specifies the type of the account that the payment was posted to.';
                }
                field("Nº cuenta"; Rec."Bal. Account No.")
                {
                    ApplicationArea = Basic, Suite;
                    Caption = 'Nº cuenta';
                    ToolTip = 'Specifies the balancing account number linked to this transaction.';
                }
                field(BalAccountName; BalAccountName)
                {
                    ApplicationArea = All;
                    Caption = 'Account Description';
                    ToolTip = 'Shows the description of the balancing account.';
                }
                field("Analitic Concept"; Rec."Global Dimension 2 Code")
                {
                    ApplicationArea = Basic, Suite;
                    Caption = 'Analitic Concept"';
                    ToolTip = 'Specifies the Analitic Concept linked to this transaction.';
                }
                field(AnalyticConceptName; AnalyticConceptName)
                {
                    ApplicationArea = All;
                    Caption = 'Analitic Concept Description';
                    ToolTip = 'Shows the description of the analytic concept.';
                }

                field("Posting Date"; Rec."Posting Date")
                {
                    ApplicationArea = Basic, Suite;
                    ToolTip = 'Specifies the posting date of the ledger entry.';
                }
                field(ARBVRNJobNo; ARBVRNJobNoTxt)
                {
                    ApplicationArea = All;
                    Caption = 'Project No.';
                    ToolTip = 'Specifies the job number related to the ledger entry.';
                }
                field(ProjectDescription; ProjectDescription)
                {
                    ApplicationArea = All;
                    Caption = 'Project Description';
                    ToolTip = 'Shows the description of the related project.';
                }
                field(ARBVRNJobTaskNo; ARBVRNJobTaskNoTxt)
                {
                    ApplicationArea = All;
                    Caption = 'Job Task No.';
                    ToolTip = 'Specifies the job task number related to the ledger entry.';
                }
                field(LinkedAppliedDocumentNo; LinkedAppliedDocumentNo)
                {
                    ApplicationArea = All;
                    Caption = 'Applied Document No.';
                    ToolTip = 'Specifies the document number that was applied in the payment reconciliation.';
                }
            }


        }
        area(factboxes)
        {
            systempart(Control1900383207; Links)
            {
                ApplicationArea = RecordLinks;
                Visible = false;
            }
            systempart(Control1905767507; Notes)
            {
                ApplicationArea = Notes;
                Visible = false;
            }
        }
    }
    var
        ARBVRNJobNoTxt: Code[20];
        ARBVRNJobTaskNoTxt: Code[20];
        BalAccountName: Text[100];
        AnalyticConceptName: Text[100];
        ProjectDescription: Text[100];
        LinkedAppliedDocumentNo: Text[200];

    trigger OnAfterGetRecord()
    var
        JobLedgerEntry: Record "Job Ledger Entry";
        GLEntry: Record "G/L Account";
        Customer: Record Customer;
        Vendor: Record Vendor;
        BankAccount: Record "Bank Account";
        Employee: Record Employee;
        ICPartner: Record "IC Partner";
        DimensionValue: Record "Dimension Value";
        JobRec: Record Job;
        PostedPaymentReconLine: Record "Posted Payment Recon. Line";
    begin
        Clear(ARBVRNJobNoTxt);
        Clear(ARBVRNJobTaskNoTxt);
        Clear(BalAccountName);
        Clear(AnalyticConceptName);
        Clear(ProjectDescription);
        Clear(LinkedAppliedDocumentNo);

        // Buscar el Proyecto
        JobLedgerEntry.SetRange("Posting Date", Rec."Posting Date");
        JobLedgerEntry.SetRange("Document No.", Rec."Document No.");
        if JobLedgerEntry.FindFirst() then begin
            ARBVRNJobNoTxt := JobLedgerEntry."Job No.";
            ARBVRNJobTaskNoTxt := JobLedgerEntry."Job Task No.";
        end;

        // Buscar la Descripción de Cuenta (según tipo de cuenta)
        case Rec."Bal. Account Type" of
            Rec."Bal. Account Type"::"G/L Account":
                if GLEntry.Get(Rec."Bal. Account No.") then
                    BalAccountName := GLEntry.Name;
            Rec."Bal. Account Type"::Customer:
                if Customer.Get(Rec."Bal. Account No.") then
                    BalAccountName := Customer.Name;
            Rec."Bal. Account Type"::Vendor:
                if Vendor.Get(Rec."Bal. Account No.") then
                    BalAccountName := Vendor.Name;
            Rec."Bal. Account Type"::"Bank Account":
                if BankAccount.Get(Rec."Bal. Account No.") then
                    BalAccountName := BankAccount.Name;
            Rec."Bal. Account Type"::Employee:
                if Employee.Get(Rec."Bal. Account No.") then
                    BalAccountName := Employee.Name;
            Rec."Bal. Account Type"::"IC Partner":
                if ICPartner.Get(Rec."Bal. Account No.") then
                    BalAccountName := ICPartner.Name;
        end;

        // Buscar descripción del concepto analítico
        if Rec."Global Dimension 2 Code" <> '' then
            if DimensionValue.Get('CA', Rec."Global Dimension 2 Code") then
                AnalyticConceptName := DimensionValue.Name;

        // Buscar descripción del proyecto
        if ARBVRNJobNoTxt <> '' then
            if JobRec.Get(ARBVRNJobNoTxt) then
                ProjectDescription := JobRec.Description;

        // Buscar movimiento conciliado en Posted Payment Recon. Line
        PostedPaymentReconLine.Reset();
        PostedPaymentReconLine.SetRange("Bank Account No.", Rec."Bank Account No.");
        PostedPaymentReconLine.SetRange("Statement No.", Rec."Statement No.");
        PostedPaymentReconLine.SetRange("Account No.", Rec."Bal. Account No.");
        PostedPaymentReconLine.SetRange("Statement Amount", Rec.Amount);
        PostedPaymentReconLine.SetRange("Value Date", Rec."Posting Date");

        if PostedPaymentReconLine.FindFirst() then begin
            LinkedAppliedDocumentNo := PostedPaymentReconLine."Applied Document No.";
        end;
    end;
}
