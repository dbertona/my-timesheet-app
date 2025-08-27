import { render, screen, fireEvent } from '@testing-library/react';
import TaskCell from '../components/timesheet/TaskCell';

it('abre dropdown de tareas con Alt+ArrowDown', () => {
  render(
    <table><tbody><tr>
      <TaskCell
        line={{ id: '1' }}
        lineIndex={0}
        colStyle={{}}
        align="left"
        editFormData={{ 1: { job_no: 'P001', job_task_no: '' } }}
        inputRefs={{ current: { 1: {} } }}
        hasRefs={false}
        setSafeRef={() => {}}
        error={null}
        isEditable={true}
        handlers={{ handleInputChange: () => {}, handleInputFocus: () => {}, handleKeyDown: () => {}, setFieldError: () => {}, clearFieldError: () => {} }}
        tasksState={{
          ensureTasksLoaded: async () => {},
          findTask: () => null,
          tasksByJob: { P001: [{ no: 'T001', description: 'Tarea demo' }] },
        }}
      />
    </tr></tbody></table>
  );
  const input = screen.getByRole('textbox');
  fireEvent.keyDown(input, { key: 'ArrowDown', altKey: true });
  expect(document.querySelector('.ts-dropdown')).toBeInTheDocument();
});
