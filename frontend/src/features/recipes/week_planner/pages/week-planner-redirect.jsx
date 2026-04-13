import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentISOWeek } from '../../../../utils/weekUtils';

export default function WeekPlannerRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect the bare planner route to the current ISO week so the main page can rely on a param.
    const currentWeek = getCurrentISOWeek();
    navigate(`/week-planner/${currentWeek}`, { replace: true });
  }, [navigate]);

  return null;
}
