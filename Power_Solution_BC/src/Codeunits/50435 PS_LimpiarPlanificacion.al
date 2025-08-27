codeunit 50435 "PS_LimpiarPlanificacion"
{
    trigger OnRun()
    var
        JobPlanningLine: Record "Job Planning Line";
        ConfirmDelete: Boolean;
    begin
        ConfirmDelete := Confirm('¿Está seguro de que desea limpiar todas las líneas antiguas de planificación?');
        if not ConfirmDelete then
            exit;

        // Eliminar líneas de planificación antiguas (más de 2 años)
        JobPlanningLine.SetFilter("Planning Date", '<%1', CalcDate('<-2Y>', Today));
        if JobPlanningLine.FindSet() then begin
            JobPlanningLine.DeleteAll();
            Message('Se han eliminado %1 líneas de planificación antiguas.', JobPlanningLine.Count);
        end else
            Message('No se encontraron líneas de planificación antiguas para eliminar.');
    end;
}
