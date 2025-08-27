/// <summary>
/// Codeunit project Calculate Statistics1 (ID 50401).
/// </summary>
codeunit 50403 "PS Calculate Statistics"
{

    trigger OnRun()
    begin
    end;

    var
        JobLedgEntry: Record "Job Ledger Entry";
        JobLedgEntry2: Record "Job Ledger Entry";
        JobPlanningLine: Record "Job Planning Line";
        JobPlanningLine2: Record "Job Planning Line";
        Expediente: Record ARBVRNJobUnits;
        Job: Record Job;
        AmountType: Option TotalCostLCY,LineAmountLCY,TotalCost,LineAmount;
        PlanLineType: Option Schedule,Contract;
        JobLedgAmounts: array[10, 4, 4] of Decimal;
        JobPlanAmounts: array[10, 4, 4] of Decimal;
        ExpedienteAmounts: array[10, 4, 4] of Decimal;
        HeadlineTxt: Label 'Budget Price,Usage Price,Billable Price,Invoiced Price,Budget Cost,Usage Cost,Billable Cost,Invoiced Cost,Budget Profit,Usage Profit,Contract Profit,Invoiced Profit';
        ProbabilityDec: Decimal;
        JobNro: Code[20];

    /// <summary>
    /// CalculateAmounts.
    /// </summary>
    procedure CalculateAmounts()
    begin
        CalcJobLedgAmounts(JobLedgEntry."Entry Type"::Usage, JobLedgEntry.Type::Resource);
        CalcJobLedgAmounts(JobLedgEntry."Entry Type"::Usage, JobLedgEntry.Type::Item);
        CalcJobLedgAmounts(JobLedgEntry."Entry Type"::Usage, JobLedgEntry.Type::"G/L Account");
        CalcJobLedgAmounts(JobLedgEntry."Entry Type"::Sale, JobLedgEntry.Type::Resource);
        CalcJobLedgAmounts(JobLedgEntry."Entry Type"::Sale, JobLedgEntry.Type::Item);
        CalcJobLedgAmounts(JobLedgEntry."Entry Type"::Sale, JobLedgEntry.Type::"G/L Account");

        CalcJobPlanAmounts(PlanLineType::Contract, JobPlanningLine.Type::Resource);
        CalcJobPlanAmounts(PlanLineType::Contract, JobPlanningLine.Type::Item);
        CalcJobPlanAmounts(PlanLineType::Contract, JobPlanningLine.Type::"G/L Account");
        CalcJobPlanAmounts(PlanLineType::Schedule, JobPlanningLine.Type::Resource);
        CalcJobPlanAmounts(PlanLineType::Schedule, JobPlanningLine.Type::Item);
        CalcJobPlanAmounts(PlanLineType::Schedule, JobPlanningLine.Type::"G/L Account");

    end;

    /// <summary>
    /// GetCostAmounts.
    /// </summary>
    /// <param name="Amt">VAR array[16] of Decimal.</param>
    procedure GetCostAmounts(var Amt: array[25] of Decimal)
    begin
        GetArrayAmounts(Amt, AmountType::TotalCost);
    end;

    /// <summary>
    /// GetHeadLineText.
    /// </summary>
    /// <param name="AmountField">array[8] of Option " ",SchPrice,UsagePrice,BillablePrice,InvoicedPrice,SchCost,UsageCost,BillableCost,InvoicedCost,SchProfit,UsageProfit,ContractProfit,InvoicedProfit.</param>
    /// <param name="CurrencyField">array[8] of Option LCY,FCY.</param>
    /// <param name="HeadLineText">VAR array[8] of Text[50].</param>
    /// <param name="Job">Record Job.</param>
    procedure GetHeadLineText(AmountField: array[8] of Option " ",SchPrice,UsagePrice,BillablePrice,InvoicedPrice,SchCost,UsageCost,BillableCost,InvoicedCost,SchProfit,UsageProfit,ContractProfit,InvoicedProfit; CurrencyField: array[8] of Option LCY,FCY; var HeadLineText: array[8] of Text[50]; Job: Record Job)
    var
        GLSetup: Record "General Ledger Setup";
        I: Integer;
        Txt: Text[30];
    begin
        Clear(HeadLineText);
        GLSetup.Get();

        for I := 1 to 8 do begin
            Txt := '';
            if CurrencyField[I] > 0 then
                Txt := Job."Currency Code";
            if Txt = '' then
                Txt := GLSetup."LCY Code";
            if AmountField[I] > 0 then
                HeadLineText[I] := SelectStr(AmountField[I], HeadlineTxt) + '\' + Txt;
        end;
    end;

    /// <summary>
    /// GetLCYCostAmounts.
    /// </summary>
    /// <param name="Amt">VAR array[16] of Decimal.</param>
    procedure GetLCYCostAmounts(var Amt: array[25] of Decimal)
    begin
        GetArrayAmounts(Amt, AmountType::TotalCostLCY);
    end;

    /// <summary>
    /// GetLCYCostAmountsProb.
    /// </summary>
    /// <param name="Amt">VAR array[16] of Decimal.</param>
    procedure GetLCYCostAmountsProb(var Amt: array[25] of Decimal)
    begin
        GetArrayAmounts(Amt, AmountType::TotalCostLCY);
    end;


    /// <summary>
    /// GetLCYPriceAmounts.
    /// </summary>
    /// <param name="Amt">VAR array[16] of Decimal.</param>
    procedure GetLCYPriceAmounts(var Amt: array[25] of Decimal)
    begin
        GetArrayAmounts(Amt, AmountType::LineAmountLCY);
    end;

    /// <summary>
    /// GetPriceAmounts.
    /// </summary>
    /// <param name="Amt">VAR array[16] of Decimal.</param>
    procedure GetPriceAmounts(var Amt: array[25] of Decimal)
    begin
        GetArrayAmounts(Amt, AmountType::LineAmount);
    end;

    /// <summary>
    /// JobCalculateCommonFilters.
    /// </summary>
    /// <param name="Job">VAR Record Job.</param>
    procedure JobCalculateCommonFilters(var Job: Record Job)
    begin
        ClearAll();
        JobNro := job."No.";
        JobPlanningLine.SetCurrentKey("Job No.", "Job Task No.");
        JobLedgEntry.SetCurrentKey("Job No.", "Job Task No.", "Entry Type");
        JobPlanningLine.FilterGroup(2);
        JobLedgEntry.SetRange("Job No.", Job."No.");
        JobPlanningLine.SetRange("Job No.", Job."No.");
        JobPlanningLine.FilterGroup(0);
        JobLedgEntry.SetFilter("Posting Date", Job.GetFilter("Posting Date Filter"));
        JobPlanningLine.SetFilter("Planning Date", Job.GetFilter("Planning Date Filter"));


        case job."PS_% Probability" of
            0:
                ProbabilityDec := 1;
            1:
                ProbabilityDec := 0.10;
            2:
                ProbabilityDec := 0.30;
            3:
                ProbabilityDec := 0.50;
            4:
                ProbabilityDec := 0.70;
            5:
                ProbabilityDec := 0.90;

        end;



        OnAfterJobCalculateCommonFilters(Job, JobLedgEntry, JobPlanningLine);
    end;

    /// <summary>
    /// JTCalculateCommonFilters.
    /// </summary>
    /// <param name="JT2">VAR Record "Job Task".</param>
    /// <param name="Job2">VAR Record Job.</param>
    /// <param name="UseJobFilter">Boolean.</param>
    procedure JTCalculateCommonFilters(var JT2: Record "Job Task"; var Job2: Record Job; UseJobFilter: Boolean)
    var
        JT: Record "Job Task";
    begin
        ClearAll();
        JT := JT2;
        JobPlanningLine.FilterGroup(2);
        JobPlanningLine.SetCurrentKey("Job No.", "Job Task No.");
        JobLedgEntry.SetCurrentKey("Job No.", "Job Task No.", "Entry Type");
        JobLedgEntry.SetRange("Job No.", JT."Job No.");
        JobPlanningLine.SetRange("Job No.", JT."Job No.");
        JobPlanningLine.FilterGroup(0);
        if JT."Job Task No." <> '' then
            if JT.Totaling <> '' then begin
                JobLedgEntry.SetFilter("Job Task No.", JT.Totaling);
                JobPlanningLine.SetFilter("Job Task No.", JT.Totaling);
            end else begin
                JobLedgEntry.SetRange("Job Task No.", JT."Job Task No.");
                JobPlanningLine.SetRange("Job Task No.", JT."Job Task No.");
            end;

        if not UseJobFilter then begin
            JobLedgEntry.SetFilter("Posting Date", JT2.GetFilter("Posting Date Filter"));
            JobPlanningLine.SetFilter("Planning Date", JT2.GetFilter("Planning Date Filter"));
        end else begin
            JobLedgEntry.SetFilter("Posting Date", Job2.GetFilter("Posting Date Filter"));
            JobPlanningLine.SetFilter("Planning Date", Job2.GetFilter("Planning Date Filter"));
        end;

        OnAfterJTCalculateCommonFilters(JT, JT2, Job2, UseJobFilter, JobLedgEntry, JobPlanningLine);
    end;
    /// <summary>
    /// ShowPlanningLine.
    /// </summary>
    /// <param name="JobType">Option " ",Resource,Item,GL.</param>
    /// <param name="Schedule">Boolean.</param>
    procedure PS_ShowPlanningLine(JobType: Option " ",Resource,Item,GL; Schedule: Boolean)
    begin
        JobPlanningLine.FilterGroup(2);
        JobPlanningLine.SetRange(JobPlanningLine."Contract Line");
        JobPlanningLine.SetRange(JobPlanningLine."Schedule Line");
        JobPlanningLine.SetRange(JobPlanningLine.Type);
        if JobType > 0 then
            JobPlanningLine.SetRange(JobPlanningLine.Type, JobType - 1);
        if Schedule then
            JobPlanningLine.SetRange(JobPlanningLine."Schedule Line", true)
        else
            JobPlanningLine.SetRange(JobPlanningLine."Contract Line", true);
        JobPlanningLine.FilterGroup(0);
        OnShowPlanningLineOnAfterJobPlanningLineSetFilters(JobPlanningLine);
        PAGE.Run(PAGE::"Job Planning Lines", JobPlanningLine);
    end;

    /// <summary>
    /// RepJobCustomer.
    /// </summary>
    /// <param name="Job2">VAR Record Job.</param>
    /// <param name="Amt">VAR array[8] of Decimal.</param>
    procedure RepJobCustomer(var Job2: Record Job; var Amt: array[8] of Decimal)
    var
        JT: Record "Job Task";
        AmountField: array[8] of Option " ",SchPrice,UsagePrice,ContractPrice,InvoicedPrice,SchCost,UsageCost,ContractCost,InvoicedCost,SchProfit,UsageProfit,ContractProfit,InvoicedProfit;
        CurrencyField: array[8] of Option LCY,FCY;
    begin
        Clear(Amt);
        if Job2."No." = '' then
            exit;
        AmountField[1] := AmountField[1] ::SchPrice;
        AmountField[2] := AmountField[2] ::UsagePrice;
        AmountField[3] := AmountField[3] ::InvoicedPrice;
        AmountField[4] := AmountField[4] ::ContractPrice;
        ReportAnalysis(Job2, JT, Amt, AmountField, CurrencyField, true);
        Amt[5] := 0;
        Amt[6] := 0;
        if Amt[1] <> 0 then
            Amt[5] := Round(Amt[2] / Amt[1] * 100);
        if Amt[4] <> 0 then
            Amt[6] := Round(Amt[3] / Amt[4] * 100);
    end;

    /// <summary>
    /// ReportAnalysis.
    /// </summary>
    /// <param name="Job2">VAR Record Job.</param>
    /// <param name="JT">VAR Record "Job Task".</param>
    /// <param name="Amt">VAR array[8] of Decimal.</param>
    /// <param name="AmountField">array[8] of Option " ",SchPrice,UsagePrice,ContractPrice,InvoicedPrice,SchCost,UsageCost,ContractCost,InvoicedCost,SchProfit,UsageProfit,ContractProfit,InvoicedProfit.</param>
    /// <param name="CurrencyField">array[8] of Option LCY,FCY.</param>
    /// <param name="JobLevel">Boolean.</param>
    procedure ReportAnalysis(var Job2: Record Job; var JT: Record "Job Task"; var Amt: array[8] of Decimal; AmountField: array[8] of Option " ",SchPrice,UsagePrice,ContractPrice,InvoicedPrice,SchCost,UsageCost,ContractCost,InvoicedCost,SchProfit,UsageProfit,ContractProfit,InvoicedProfit; CurrencyField: array[8] of Option LCY,FCY; JobLevel: Boolean)
    var
        PL: array[25] of Decimal;
        CL: array[25] of Decimal;
        P: array[16] of Decimal;
        C: array[16] of Decimal;
        E: Decimal;
        I: Integer;
    begin
        if JobLevel then
            JobCalculateCommonFilters(Job2)
        else
            JTCalculateCommonFilters(JT, Job2, true);
        CalculateAmounts();
        GetLCYCostAmounts(CL);
        GetCostAmounts(C);
        GetLCYPriceAmounts(PL);
        GetPriceAmounts(P);

        OnReportAnalysisOnAfterGetAmounts(PL, CL, P, C, I);

        Clear(Amt);
        for I := 1 to 8 do begin
            if AmountField[I] = AmountField[I] ::SchPrice then
                if CurrencyField[I] = CurrencyField[I] ::LCY then
                    Amt[I] := PL[4]
                else
                    Amt[I] := P[4];
            if AmountField[I] = AmountField[I] ::UsagePrice then
                if CurrencyField[I] = CurrencyField[I] ::LCY then
                    Amt[I] := PL[8]
                else
                    Amt[I] := P[8];
            if AmountField[I] = AmountField[I] ::ContractPrice then
                if CurrencyField[I] = CurrencyField[I] ::LCY then
                    Amt[I] := PL[12]
                else
                    Amt[I] := P[12];
            if AmountField[I] = AmountField[I] ::InvoicedPrice then
                if CurrencyField[I] = CurrencyField[I] ::LCY then
                    Amt[I] := PL[16]
                else
                    Amt[I] := P[16];

            if AmountField[I] = AmountField[I] ::SchCost then
                if CurrencyField[I] = CurrencyField[I] ::LCY then
                    Amt[I] := CL[4]
                else
                    Amt[I] := C[4];
            if AmountField[I] = AmountField[I] ::UsageCost then
                if CurrencyField[I] = CurrencyField[I] ::LCY then
                    Amt[I] := CL[8]
                else
                    Amt[I] := C[8];
            if AmountField[I] = AmountField[I] ::ContractCost then
                if CurrencyField[I] = CurrencyField[I] ::LCY then
                    Amt[I] := CL[12]
                else
                    Amt[I] := C[12];
            if AmountField[I] = AmountField[I] ::InvoicedCost then
                if CurrencyField[I] = CurrencyField[I] ::LCY then
                    Amt[I] := CL[16]
                else
                    Amt[I] := C[16];

            if AmountField[I] = AmountField[I] ::SchProfit then
                if CurrencyField[I] = CurrencyField[I] ::LCY then
                    Amt[I] := PL[4] - CL[4]
                else
                    Amt[I] := P[4] - C[4];
            if AmountField[I] = AmountField[I] ::UsageProfit then
                if CurrencyField[I] = CurrencyField[I] ::LCY then
                    Amt[I] := PL[8] - CL[8]
                else
                    Amt[I] := P[8] - C[8];
            if AmountField[I] = AmountField[I] ::ContractProfit then
                if CurrencyField[I] = CurrencyField[I] ::LCY then
                    Amt[I] := PL[12] - CL[12]
                else
                    Amt[I] := P[12] - C[12];
            if AmountField[I] = AmountField[I] ::InvoicedProfit then
                if CurrencyField[I] = CurrencyField[I] ::LCY then
                    Amt[I] := PL[16] - CL[16]
                else
                    Amt[I] := P[16] - C[16];
            if AmountField[I] = AmountField[I] ::InvoicedProfit then
                if CurrencyField[I] = CurrencyField[I] ::LCY then
                    Amt[I] := PL[16] - CL[16]
                else
                    Amt[I] := P[16] - C[16];
        end;

        OnAfterReportAnalysis(AmountField, CurrencyField, Amt);
    end;


    /// <param name="Job2">VAR Record Job.</param>
    /// <param name="JT">VAR Record "Job Task".</param>
    /// <param name="Amt">VAR array[8] of Decimal.</param>
    /// <param name="CurrencyField">array[8] of Option LCY,FCY.</param>
    procedure ReportSuggBilling(var Job2: Record Job; var JT: Record "Job Task"; var Amt: array[8] of Decimal; CurrencyField: array[8] of Option LCY,FCY)
    var
        AmountField: array[8] of Option " ",SchPrice,UsagePrice,ContractPrice,InvoicedPrice,SchCost,UsageCost,ContractCost,InvoicedCost,SchProfit,UsageProfit,ContractProfit,InvoicedProfit;
    begin
        AmountField[1] := AmountField[1] ::ContractCost;
        AmountField[2] := AmountField[2] ::ContractPrice;
        AmountField[3] := AmountField[3] ::InvoicedCost;
        AmountField[4] := AmountField[4] ::InvoicedPrice;
        AmountField[4] := AmountField[4] ::InvoicedPrice;
        ReportAnalysis(Job2, JT, Amt, AmountField, CurrencyField, false);
        Amt[5] := Amt[1] - Amt[3];
        Amt[6] := Amt[2] - Amt[4];
    end;

    /// <summary>
    /// ShowLedgEntry.
    /// </summary>
    /// <param name="JobType">Option " ",Resource,Item,GL.</param>
    /// <param name="Usage">Boolean.</param>
    procedure ShowLedgEntry(JobType: Option " ",Resource,Item,GL; Usage: Boolean)
    var
        JobLedgerEntries: Page "Job Ledger Entries";
    begin
        JobLedgEntry.SetRange(Type);
        if Usage then
            JobLedgEntry.SetRange("Entry Type", JobLedgEntry."Entry Type"::Usage)
        else
            JobLedgEntry.SetRange("Entry Type", JobLedgEntry."Entry Type"::Sale);
        if JobType > 0 then
            JobLedgEntry.SetRange(Type, JobType - 1);
        Clear(JobLedgerEntries);
        JobLedgerEntries.SetTableView(JobLedgEntry);
        JobLedgerEntries.Run();
    end;

    local procedure CalcJobLedgAmounts(EntryType: Enum "Job Journal Line Entry Type"; TypeParm: Enum "Job Planning Line Type")
    begin
        JobLedgEntry2.Copy(JobLedgEntry);
        JobLedgEntry2.SetRange(JobLedgEntry2."Entry Type", EntryType);
        JobLedgEntry2.SetRange(JobLedgEntry2.Type, TypeParm);
        JobLedgEntry2.CalcSums(JobLedgEntry2."Total Cost (LCY)", JobLedgEntry2."Line Amount (LCY)", JobLedgEntry2."Total Cost", JobLedgEntry2."Line Amount");
        JobLedgAmounts[1 + EntryType.AsInteger(), 1 + TypeParm.AsInteger(), 1 + AmountType::TotalCostLCY] := JobLedgEntry2."Total Cost (LCY)";
        JobLedgAmounts[1 + EntryType.AsInteger(), 1 + TypeParm.AsInteger(), 1 + AmountType::LineAmountLCY] := JobLedgEntry2."Line Amount (LCY)";
        JobLedgAmounts[1 + EntryType.AsInteger(), 1 + TypeParm.AsInteger(), 1 + AmountType::TotalCost] := JobLedgEntry2."Total Cost";
        JobLedgAmounts[1 + EntryType.AsInteger(), 1 + TypeParm.AsInteger(), 1 + AmountType::LineAmount] := JobLedgEntry2."Line Amount";
    end;

    local procedure CalcJobPlanAmounts(PlanLineTypeParm: Option; TypeParm: Enum "Job Planning Line Type")
    begin
        JobPlanningLine2.Copy(JobPlanningLine);
        JobPlanningLine2.SetRange(JobPlanningLine2."Schedule Line");
        JobPlanningLine2.SetRange(JobPlanningLine2."Contract Line");
        if PlanLineTypeParm = PlanLineType::Schedule then
            JobPlanningLine2.SetRange(JobPlanningLine2."Schedule Line", true)
        else
            JobPlanningLine2.SetRange(JobPlanningLine2."Contract Line", true);
        JobPlanningLine2.SetRange(JobPlanningLine2.Type, TypeParm);
        OnCalcJobPlanAmountsOnAfterJobPlanningLineSetFilters(JobPlanningLine2);

        JobPlanningLine2.CalcSums(JobPlanningLine2."Total Cost (LCY)", JobPlanningLine2."Line Amount (LCY)", JobPlanningLine2."Total Cost", JobPlanningLine2."Line Amount");
        JobPlanAmounts[1 + PlanLineTypeParm, 1 + TypeParm.AsInteger(), 1 + AmountType::TotalCostLCY] := JobPlanningLine2."Total Cost (LCY)";
        JobPlanAmounts[1 + PlanLineTypeParm, 1 + TypeParm.AsInteger(), 1 + AmountType::LineAmountLCY] := JobPlanningLine2."Line Amount (LCY)";
        JobPlanAmounts[1 + PlanLineTypeParm, 1 + TypeParm.AsInteger(), 1 + AmountType::TotalCost] := JobPlanningLine2."Total Cost";
        JobPlanAmounts[1 + PlanLineTypeParm, 1 + TypeParm.AsInteger(), 1 + AmountType::LineAmount] := JobPlanningLine2."Line Amount";
    end;

    local procedure GetArrayAmounts(var Amt: array[25] of Decimal; AmountTypeParm: Option)
    Var
        Total: Decimal;
    begin
        Amt[1] := JobPlanAmounts[1 + PlanLineType::Schedule, 1 + JobPlanningLine.Type::Resource.AsInteger(), 1 + AmountTypeParm];
        Amt[2] := JobPlanAmounts[1 + PlanLineType::Schedule, 1 + JobPlanningLine.Type::Item.AsInteger(), 1 + AmountTypeParm];
        Amt[3] := JobPlanAmounts[1 + PlanLineType::Schedule, 1 + JobPlanningLine.Type::"G/L Account".AsInteger(), 1 + AmountTypeParm];
        Amt[4] := Amt[1] + Amt[2] + Amt[3];
        Amt[5] := JobLedgAmounts[1 + JobLedgEntry."Entry Type"::Usage.AsInteger(), 1 + JobLedgEntry.Type::Resource.AsInteger(), 1 + AmountTypeParm];
        Amt[6] := JobLedgAmounts[1 + JobLedgEntry."Entry Type"::Usage.AsInteger(), 1 + JobLedgEntry.Type::Item.AsInteger(), 1 + AmountTypeParm];
        Amt[7] := JobLedgAmounts[1 + JobLedgEntry."Entry Type"::Usage.AsInteger(), 1 + JobLedgEntry.Type::"G/L Account".AsInteger(), 1 + AmountTypeParm];
        Amt[8] := Amt[5] + Amt[6] + Amt[7];
        Amt[9] := JobPlanAmounts[1 + PlanLineType::Contract, 1 + JobPlanningLine.Type::Resource.AsInteger(), 1 + AmountTypeParm];
        Amt[10] := JobPlanAmounts[1 + PlanLineType::Contract, 1 + JobPlanningLine.Type::Item.AsInteger(), 1 + AmountTypeParm];
        Amt[11] := JobPlanAmounts[1 + PlanLineType::Contract, 1 + JobPlanningLine.Type::"G/L Account".AsInteger(), 1 + AmountTypeParm];
        Amt[12] := Amt[9] + Amt[10] + Amt[11] + getExpediente(JobNro);
        Amt[13] := -JobLedgAmounts[1 + JobLedgEntry."Entry Type"::Sale.AsInteger(), 1 + JobLedgEntry.Type::Resource.AsInteger(), 1 + AmountTypeParm];
        Amt[14] := -JobLedgAmounts[1 + JobLedgEntry."Entry Type"::Sale.AsInteger(), 1 + JobLedgEntry.Type::Item.AsInteger(), 1 + AmountTypeParm];
        Amt[15] := -JobLedgAmounts[1 + JobLedgEntry."Entry Type"::Sale.AsInteger(), 1 + JobLedgEntry.Type::"G/L Account".AsInteger(), 1 + AmountTypeParm];
        Amt[16] := Amt[13] + Amt[14] + Amt[15];
        Amt[17] := JobPlanAmounts[1 + PlanLineType::Schedule, 1 + JobPlanningLine.Type::Resource.AsInteger(), 1 + AmountTypeParm] * ProbabilityDec;
        Amt[18] := JobPlanAmounts[1 + PlanLineType::Schedule, 1 + JobPlanningLine.Type::Item.AsInteger(), 1 + AmountTypeParm] * ProbabilityDec;
        Amt[19] := JobPlanAmounts[1 + PlanLineType::Schedule, 1 + JobPlanningLine.Type::"G/L Account".AsInteger(), 1 + AmountTypeParm] * ProbabilityDec;
        Amt[20] := Amt[17] + Amt[18] + Amt[19];
        Amt[21] := JobPlanAmounts[1 + PlanLineType::Contract, 1 + JobPlanningLine.Type::Resource.AsInteger(), 1 + AmountTypeParm] * ProbabilityDec;
        Amt[22] := JobPlanAmounts[1 + PlanLineType::Contract, 1 + JobPlanningLine.Type::Item.AsInteger(), 1 + AmountTypeParm] * ProbabilityDec;
        Amt[23] := JobPlanAmounts[1 + PlanLineType::Contract, 1 + JobPlanningLine.Type::"G/L Account".AsInteger(), 1 + AmountTypeParm] * ProbabilityDec;
        Amt[24] := Amt[21] + Amt[22] + Amt[23];

    end;

    local procedure getExpediente(VAR Job: Code[20]): Decimal
    var
        MyQuery: Query "PS_Expediente";
        Total: Decimal;
    begin
        MyQuery.SetFilter(ARBVRNJobNo, JobNro);
        MyQuery.Open;
        clear(total);
        while MyQuery.Read do begin
            Total := Total + MyQuery.ARBVRNAcumContractSalesAmount;
            //proyecto := MyQuery.ARBVRNJobNo
        end;
        MyQuery.Close;
        EXIT(Total)
    end;

    procedure ShowPlanningLine(JobType: Option " ",Resource,Item,GL; Schedule: Boolean)
    begin
        JobPlanningLine.FilterGroup(2);
        JobPlanningLine.SetRange("Contract Line");
        JobPlanningLine.SetRange("Schedule Line");
        JobPlanningLine.SetRange(Type);
        if JobType > 0 then
            JobPlanningLine.SetRange(Type, JobType - 1);
        if Schedule then
            JobPlanningLine.SetRange("Schedule Line", true)
        else
            JobPlanningLine.SetRange("Contract Line", true);
        JobPlanningLine.FilterGroup(0);
        OnShowPlanningLineOnAfterJobPlanningLineSetFilters(JobPlanningLine);
        PAGE.Run(PAGE::"Job Planning Lines", JobPlanningLine);
    end;

    [IntegrationEvent(false, false)]
    local procedure OnAfterJobCalculateCommonFilters(var Job: Record Job; var JobLedgerEntry: Record "Job Ledger Entry"; var JobPlanningLine: Record "Job Planning Line")
    begin
    end;

    [IntegrationEvent(false, false)]
    local procedure OnAfterJTCalculateCommonFilters(JobTask: Record "Job Task"; var JobTask2: Record "Job Task"; var Job2: Record Job; UseJobFilter: Boolean; var JobLedgerEntry: Record "Job Ledger Entry"; var JobPlanningLine: Record "Job Planning Line")
    begin
    end;

    [IntegrationEvent(false, false)]
    local procedure OnAfterReportAnalysis(AmountField: array[8] of Option " ",SchPrice,UsagePrice,ContractPrice,InvoicedPrice,SchCost,UsageCost,ContractCost,InvoicedCost,SchProfit,UsageProfit,ContractProfit,InvoicedProfit; CurrencyField: array[8] of Option LCY,FCY; var Amt: array[8] of Decimal)
    begin
    end;

    [IntegrationEvent(false, false)]
    local procedure OnCalcJobPlanAmountsOnAfterJobPlanningLineSetFilters(var JobPlanningLine: Record "Job Planning Line")
    begin
    end;

    [IntegrationEvent(false, false)]
    local procedure OnReportAnalysisOnAfterGetAmounts(var PL: array[16] of Decimal; var CL: array[25] of Decimal; var P: array[16] of Decimal; var C: array[16] of Decimal; var I: Integer)
    begin
    end;

    [IntegrationEvent(false, false)]
    local procedure OnShowPlanningLineOnAfterJobPlanningLineSetFilters(var JobPlanningLine: Record "Job Planning Line")
    begin
    end;
}


