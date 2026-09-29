export default function XrayUploadPanel({
  preview,
  fileLabel,
  note,
  onFileChange,
  onNoteChange,
  title = 'X-ray',
  notePlaceholder = 'Any notes about this X-ray'
}) {
  return (
    <div className="bg-white border border-line rounded-lg p-5">
      <h2 className="text-base mb-3">{title}</h2>
      <label className="block border-[1.5px] border-dashed border-line rounded-lg p-4 text-center cursor-pointer hover:border-primary mb-3">
        <span className="text-sm text-ink-soft">
          {fileLabel || 'Click to upload an X-ray image'}
        </span>
        <input type="file" accept="image/*" onChange={onFileChange} className="hidden" />
      </label>
      {preview && (
        <img src={preview} alt="Uploaded X-ray preview" className="max-h-48 rounded-md mb-3 mx-auto" />
      )}
      <label htmlFor="xrayNote" className="block text-sm font-semibold mb-1.5">Notes</label>
      <textarea
        id="xrayNote"
        rows={3}
        value={note}
        onChange={onNoteChange}
        placeholder={notePlaceholder}
        className="w-full px-3 py-2.5 border-[1.5px] border-line rounded-md bg-bg focus:bg-white focus:border-primary outline-none text-sm"
      />
    </div>
  )
}
