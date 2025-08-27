codeunit 50405 "PS_ApplyJobFilter"
{
    procedure ApplyFilter(var RecRef: RecordRef; FieldId: Integer; JobTypeFilter: Enum "PS_JobTypeEnum"; var AdditionalRecRef: RecordRef; AdditionalFieldId: Integer)
    var
        JobTeamRec: Record ARBVRNJobTeam;
        User: Record User;
        ResourceRec: Record Resource;
        JobRec: Record Job;
        UserEmail: Text[250];
        ResourceNo: Code[20];
        Filter: Text;
        FilterCount: Integer;
        FirstJobNo: Code[20];
        FieldRef: FieldRef;
        JobTypeFilterText: Text[30];
        AdditionalFieldRef: FieldRef;
    begin
        // Obtener el ID del usuario actual
        if not User.Get(UserSecurityID) then begin
            Message('No se encontró el ID de usuario.');
            exit;
        end;
        UserEmail := User."Authentication Email";

        // Convertir el filtro de Enum a Text
        JobTypeFilterText := FORMAT(JobTypeFilter);

        // Establecer el rango para buscar el recurso utilizando el campo ARBVRNEMail
        ResourceRec.SetRange(ARBVRNEMail, UserEmail);
        if ResourceRec.FindFirst() then begin
            ResourceNo := ResourceRec."No.";
            JobTeamRec.SetRange(ARBVRNResourceNo, ResourceNo);
            Filter := '';
            FilterCount := 0;
            if JobTeamRec.FindSet() then begin
                repeat
                    // Verificar si el proyecto existe en la tabla Job
                    if JobRec.Get(JobTeamRec.ARBVRNJobNo) and (not JobTeamRec.PS_SoloImputar) then begin
                        // Filtrar los trabajos según el JobTypeFilter
                        if (JobTypeFilter = JobTypeFilter::Todos) or (FORMAT(JobRec.ARBVRNJobType) = JobTypeFilterText) then begin
                            if FilterCount = 0 then
                                FirstJobNo := JobTeamRec.ARBVRNJobNo;
                            FilterCount += 1;
                        end;
                    end;
                until JobTeamRec.Next() = 0;

                FieldRef := RecRef.FIELD(FieldId);

                if FilterCount = 1 then begin
                    FieldRef.SETRANGE(FirstJobNo);
                end else begin
                    // SetRange para múltiples JobNos, simulado aquí usando SetFilter.
                    Filter := '';
                    JobTeamRec.FindSet();
                    repeat
                        // Verificar si el proyecto existe en la tabla Job
                        if JobRec.Get(JobTeamRec.ARBVRNJobNo) and (not JobTeamRec.PS_SoloImputar) then begin
                            // Filtrar los trabajos según el JobTypeFilter
                            if (JobTypeFilter = JobTypeFilter::Todos) or (FORMAT(JobRec.ARBVRNJobType) = JobTypeFilterText) then begin
                                if Filter = '' then
                                    Filter := JobTeamRec.ARBVRNJobNo
                                else
                                    Filter := Filter + '|' + JobTeamRec.ARBVRNJobNo;
                            end;
                        end;
                    until JobTeamRec.Next() = 0;

                    // Aplicar el filtro en la referencia principal
                    IF FilterCount > 0 THEN BEGIN
                        FieldRef.SETFILTER(Filter);
                    END ELSE BEGIN
                        FieldRef.SETFILTER(Filter);
                    END;


                    // Aplicar el filtro en la referencia adicional si está inicializada
                    if AdditionalFieldId > 0 then begin
                        AdditionalFieldRef := AdditionalRecRef.FIELD(AdditionalFieldId);
                        AdditionalFieldRef.SETFILTER(Filter);
                    end;
                end;
            end else begin
                FieldRef := RecRef.FIELD(FieldId);
                FieldRef.SETRANGE(''); // Si no hay trabajos, filtrar para mostrar ninguno

                // Limpiar filtro en la referencia adicional si está inicializada
                if AdditionalFieldId > 0 then begin
                    AdditionalFieldRef := AdditionalRecRef.FIELD(AdditionalFieldId);
                    AdditionalFieldRef.SETRANGE('');
                end;
            end;
        end else begin
            Message('No se encontró el recurso con el correo %1.', UserEmail);
        end;
    end;
}
