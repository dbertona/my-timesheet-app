query 50218 PS_ObjectivesByDepartaments
{
    APIGroup = 'PS_API';
    APIPublisher = 'Power_Solution';
    APIVersion = 'v2.0';
    EntityName = 'ObjectivesByDepartaments';
    EntitySetName = 'ObjectivesByDepartaments';
    QueryType = API;
    elements
    {
        dataitem(psObjectivesByDepartments; PS_ObjectivesByDepartments)
        {
            column(Departments; PS_Departments)
            {
            }
            column(Year; PS_Year)
            {
            }
            column(CostTarget; "PS_Cost Target")
            {
            }
            column(BillingTarget; "PS_Billing Target")
            {
            }
            column(MarginTarget; "PS_Margin Target")
            {
            }
        }
    }

    trigger OnBeforeOpen()
    begin

    end;
}
