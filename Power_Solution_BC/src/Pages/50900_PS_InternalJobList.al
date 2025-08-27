/// <summary>
/// PageExtension PS_OperativeJobLis (ID 50001) extends Record ARBVRNOperativeJobList.
/// </summary>
pageextension 50900 PS_InternalJobList extends ARBVRNInternalJobList
{

    trigger OnOpenPage()
    begin
        Error('El acceso a esta página está restringido.');
    end;
}
