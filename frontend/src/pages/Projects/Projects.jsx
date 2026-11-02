import { useMemo, useRef, useState } from 'react';
import ApiState from '../../components/ApiState/ApiState';
import { useApiData } from '../../services/api/useApiData';
import { presentProject } from '../../services/api/presentRecords';
import FilterChips from '../../components/EventUI/FilterChips';
import SectionHeading from '../../components/EventUI/SectionHeading';
import {
  filterProjects,
} from '../../data/projects';
import ProjectCard from './components/ProjectCard';
import circuitPattern from '../Workshops/assets/circuit-pattern.svg';
import teamIcon from './assets/team.svg';
import ProjectsCircuit from './ProjectsCircuit';
import { useLanguage } from '../../services/api/publicContentLanguage';
import './Projects.css';

export default function Projects() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { data, loading, error, reload } = useApiData('projects');
  const { language: lang, dir, t } = useLanguage();
  // presentProject localizes titles and labels, so it re-runs when the language changes
  const projects = useMemo(() => (data || []).map(presentProject), [data, lang]);
  const projectCategories = useMemo(() => {
    const language = lang === 'en' ? 1 : 0;
    const labels = { defense: ['مشاريع دفاعية','Defense projects'], invention: ['مشاريع ابتكارية','Invention projects'] };
    return [{ id: 'all', label: language ? 'All projects' : 'عرض الكل' }, ...[...new Set(projects.map((project) => project.categoryId))].map((id) => ({ id, label: labels[id]?.[language] || id }))];
  }, [projects, lang]);

  const visibleProjects = useMemo(
    () => filterProjects(projects, selectedCategory, searchQuery),
    [projects, searchQuery, selectedCategory],
  );
  const hasSearchQuery = searchQuery.trim().length > 0;
  const rootRef = useRef(null);
  const signature = loading ? 'loading' : `${selectedCategory}|${visibleProjects.map((p) => p.id).join(',')}`;

  return (
    <div ref={rootRef} className="projects-page" dir={dir}>
      <ProjectsCircuit rootRef={rootRef} signature={signature} />
      <header className="projects-hero">
        <img className="projects-hero__pattern" src={circuitPattern} alt="" />
        <div className="projects-page__container projects-hero__content">
          <div className="projects-overline"><span lang="en">SHOWROOM</span><i /></div>
          <h1>{t('معرض المشاريع', 'Project Showroom')}</h1>
          <p>{t('اكتشف المشاريع التقنية والابتكارية المشاركة في روبوتاكتك، وتعرّف على أفكار الفرق وأعضائها بعد اعتماد مشاركتهم.',
            'Discover the technical and innovation projects taking part in RoboTactic, and meet the teams behind them once their participation is approved.')}</p>
        </div>
      </header>

      <section className="projects-browser" aria-labelledby="projects-browser-title">
        <div className="projects-page__container">
          <SectionHeading id="projects-browser-title">{t('تصفّح المشاريع', 'Browse projects')}</SectionHeading>
          <div className="projects-controls">
            <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('ابحث عن مشروع', 'Search projects')} aria-label={t('ابحث عن مشروع', 'Search projects')} />
            <FilterChips items={projectCategories} selectedId={selectedCategory}
              onSelect={setSelectedCategory} ariaLabel={t('تصفية المشاريع حسب التصنيف', 'Filter projects by category')}
              className="projects-filters" />
          </div>

          <ApiState loading={loading} error={error} empty={!loading && !error && !projects.length ? t('لا توجد مشاريع منشورة حاليًا.', 'No projects have been published yet.') : ''} onRetry={reload} />
          {!loading && !error && visibleProjects.length ? (
            <div className="projects-grid">
              {visibleProjects.map((project) => (
                <ProjectCard key={project.id} project={project} teamIcon={teamIcon} />
              ))}
            </div>
          ) : !loading && !error && projects.length > 0 && (
            <div className="projects-empty" role="status">
              <h3>{hasSearchQuery ? t('لا توجد نتائج مطابقة.', 'No matching results.') : t('لا توجد مشاريع مطابقة للتصفية.', 'No projects match this filter.')}</h3>
              <p>{t('جرّب تعديل عبارة البحث أو اختيار تصنيف آخر.', 'Try a different search term or choose another category.')}</p>
            </div>
          )}
        </div>
      </section>
      <div className="rt-end" aria-hidden="true" />
    </div>
  );
}
