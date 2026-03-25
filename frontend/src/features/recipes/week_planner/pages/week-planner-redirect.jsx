import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentISOWeek } from '../../../../utils/weekUtils';

export default function WeekPlannerRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const currentWeek = getCurrentISOWeek();
    navigate(`/week-planner/${currentWeek}`, { replace: true });
  }, [navigate]);

  return null;
}
