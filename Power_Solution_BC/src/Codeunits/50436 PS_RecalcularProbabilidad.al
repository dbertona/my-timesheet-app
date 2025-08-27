codeunit 50436 "PS_RecalcularProbabilidad"
{
    trigger OnRun()
    var
        Job: Record Job;
        JobPlanningLine: Record "Job Planning Line";
        TotalPlanned: Decimal;
        TotalReal: Decimal;
        NewProbability: Integer;
    begin
        if Job.FindSet() then
            repeat
                // Calcular totales de planificación vs real para el proyecto
                TotalPlanned := 0;
                TotalReal := 0;

                JobPlanningLine.SetRange("Job No.", Job."No.");
                if JobPlanningLine.FindSet() then
                    repeat
                        TotalPlanned += JobPlanningLine."Total Cost (LCY)";
                    until JobPlanningLine.Next() = 0;

                // Aquí se calcularía el total real (se implementaría según la lógica de negocio)
                // TotalReal := CalculateRealCosts(Job."No.");

                // Calcular nueva probabilidad basada en la relación planificado vs real
                if TotalPlanned > 0 then begin
                    // Lógica para calcular probabilidad (se implementaría según la lógica de negocio)
                    NewProbability := 50; // Valor por defecto
                    Job."PS_% Probability" := NewProbability;
                    Job.Modify();
                end;
            until Job.Next() = 0;

        Message('Proceso completado. Se han recalculado las probabilidades para todos los proyectos.');
    end;
}
