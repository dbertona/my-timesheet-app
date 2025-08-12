  const qtyAutosave = useFieldAutosave({
    field: "quantity",
    debounceMs: 700,
    editFormData,
    latestEditRef,
    setLines,
    setInitialEditData,
    supabaseClient,
    toDbValue: (v) => (v === "" || v === null || typeof v === "undefined" ? null : Number(v)),
  });

  const descAutosave = useFieldAutosave({
    field: "description",
    debounceMs: 700,
    editFormData,
    latestEditRef,
    setLines,
    setInitialEditData,
    supabaseClient,
    toDbValue: (v) => (typeof v === "string" ? v : v == null ? "" : String(v)),
  });

  const jobNoAutosave = useFieldAutosave({
    field: "job_no",
    debounceMs: 700,
    editFormData,
    latestEditRef,
    setLines,
    setInitialEditData,
    supabaseClient,
    toDbValue: (v) => (v == null || v === "" ? null : v),
  });

  const jobTaskAutosave = useFieldAutosave({
    field: "job_task_no",
    debounceMs: 700,
    editFormData,
    latestEditRef,
    setLines,
    setInitialEditData,
    supabaseClient,
    toDbValue: (v) => (v == null || v === "" ? null : v),
  });

  const workTypeAutosave = useFieldAutosave({
    field: "work_type",
    debounceMs: 700,
    editFormData,
    latestEditRef,
    setLines,
    setInitialEditData,
    supabaseClient,
    toDbValue: (v) => (v == null || v === "" ? null : v),
  });

  const handleInputChangeWithAuto = (lineId, field, value) => {
    handleInputChange(lineId, field, value);
    if (String(lineId).startsWith("tmp-")) return; // no autosave for temp rows
    if (field === "quantity") return qtyAutosave.schedule(lineId);
    if (field === "description") return descAutosave.schedule(lineId);
    if (field === "job_no") return jobNoAutosave.schedule(lineId);
    if (field === "job_task_no") return jobTaskAutosave.schedule(lineId);
    if (field === "work_type") return workTypeAutosave.schedule(lineId);
  };
