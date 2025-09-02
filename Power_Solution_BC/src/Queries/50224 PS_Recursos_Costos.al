/// <summary>
/// Query PS_RecursosCostos (ID 50224).
/// </summary>
query 50224 PS_RecursosCostos
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'RecursosCostos';
    EntitySetName = 'RecursosCostos';
    QueryType = API;

    elements
    {
        dataitem(ResourceCost; "Resource Cost")
        {
            DataItemTableFilter = Code = filter('<>'''');
            column(resource_no; Code)
            {
            }
            column(work_type; "Work Type Code")
            {
            }
            column(unit_cost; "Unit Cost")
            {
            }
            column(lastModifiedDateTime; SystemModifiedAt)
            {
            }

            dataitem(Resource; Resource)
            {
                DataItemLink = "No." = ResourceCost.Code;
                DataItemTableFilter = ARBVRNEMail = filter('*@*'), "Global Dimension 1 Code" = filter('<>''''');
                column(resource_email; ARBVRNEMail)
                {
                }
                column(resource_department; "Global Dimension 1 Code")
                {
                }
            }
        }
    }

    trigger OnBeforeOpen()
    begin

    end;
}
