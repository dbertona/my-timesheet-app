codeunit 50434 "PS_ProcessClosedMonthClosings"
{
    trigger OnRun()
    var
        MonthClosing: Record "PS_MonthClosing";
        JobPlanningLine: Record "Job Planning Line";
        JobLedgerEntry: Record "Job Ledger Entry";
        TotalCost: Decimal;
        TotalPrice: Decimal;
    begin
        // Procesar todos los meses cerrados
        MonthClosing.SetRange(PS_Status, MonthClosing.PS_Status::Close);
        if MonthClosing.FindSet() then
            repeat
                // Calcular totales de costos y precios para el proyecto y mes
                TotalCost := 0;
                TotalPrice := 0;

                // Sumar costos y precios de Job Planning Lines
                JobPlanningLine.SetRange("Job No.", MonthClosing.PS_JobNo);
                if JobPlanningLine.FindSet() then
                    repeat
                        TotalCost += JobPlanningLine."Total Cost (LCY)";
                        TotalPrice += JobPlanningLine."Line Amount (LCY)";
                    until JobPlanningLine.Next() = 0;

                // Sumar costos y precios de Job Ledger Entries
                JobLedgerEntry.SetRange("Job No.", MonthClosing.PS_JobNo);
                if JobLedgerEntry.FindSet() then
                    repeat
                        TotalCost += JobLedgerEntry."Total Cost (LCY)";
                        TotalPrice += JobLedgerEntry."Line Amount (LCY)";
                    until JobLedgerEntry.Next() = 0;

                // Actualizar totales en MonthClosing
                MonthClosing.PS_CostTotal := TotalCost;
                MonthClosing.PS_BillablePriceTotal := TotalPrice;
                MonthClosing.Modify();
            until MonthClosing.Next() = 0;

        Message('Proceso completado. Se han actualizado los totales de costos y precios para todos los meses cerrados.');
    end;
}
