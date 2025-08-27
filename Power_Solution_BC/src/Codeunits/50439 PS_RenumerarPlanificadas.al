codeunit 50439 "PS_RenumerarPlanificadas"
{
    trigger OnRun()
    var
        JobPlanningLine: Record "Job Planning Line";
        TempJobPlanningLine: Record "Job Planning Line" temporary;
        NewLineNo: Integer;
        ConfirmRenumber: Boolean;
    begin
        ConfirmRenumber := Confirm('¿Está seguro de que desea renumerar todas las líneas de planificación?');
        if not ConfirmRenumber then
            exit;

        NewLineNo := 10000; // Valor inicial para el primer número de línea

        // Ordena los registros por SystemCreatedAt y los copia en una tabla temporal
        JobPlanningLine.SetCurrentKey(SystemCreatedAt);
        if JobPlanningLine.FindSet() then begin
            repeat
                // Copiar el registro a la tabla temporal
                TempJobPlanningLine := JobPlanningLine;
                TempJobPlanningLine."Line No." := NewLineNo; // Asigna el nuevo número de línea
                TempJobPlanningLine.Insert(); // Inserta en la tabla temporal
                NewLineNo += 10000; // Incrementa el número de línea para el siguiente registro
            until JobPlanningLine.Next() = 0;
        end;

        // Elimina los registros originales
        JobPlanningLine.DeleteAll();

        // Inserta los registros renumerados de la tabla temporal
        if TempJobPlanningLine.FindSet() then begin
            repeat
                JobPlanningLine := TempJobPlanningLine;
                JobPlanningLine.Insert(); // Inserta en la tabla original
            until TempJobPlanningLine.Next() = 0;
        end;

        Message('Renumeración completada. Se han renumerado %1 líneas de planificación.', TempJobPlanningLine.Count);
    end;
}
