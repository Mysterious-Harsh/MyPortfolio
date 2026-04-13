import json
import os
from django.shortcuts import render
from django.conf import settings
from django.core.mail import send_mail
from django.templatetags.static import static
from .forms import ContactForm


def load_data() -> dict:
    """Single source of truth — reads master_background.json once per request."""
    path = os.path.join(settings.BASE_DIR, 'resources', 'master_background.json')
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def home(request):
    data = load_data()
    featured_projects = [p for p in data['projects'] if p.get('featured')]
    hp = data.get('homepage', {})

    def lerp_color(t: float) -> str:
        """Interpolate between indigo (#4F46E5) and teal (#14F1D9) at position t∈[0,1]."""
        r = round(0x4F + (0x14 - 0x4F) * t)
        g = round(0x46 + (0xF1 - 0x46) * t)
        b = round(0xE5 + (0xD9 - 0xE5) * t)
        return f'#{r:02x}{g:02x}{b:02x}'

    skills_items = list(data['skills'].items())
    n = len(skills_items)
    skill_rows = [
        {
            'label':  key.replace('_', ' '),
            'color':  lerp_color(i / max(n - 1, 1)),
            'skills': skills,
        }
        for i, (key, skills) in enumerate(skills_items)
    ]

    return render(request, 'core/index.html', {
        'data':              data,
        'featured_projects': featured_projects,
        'skill_rows':        skill_rows,
        'page':              'home',
    })


def about(request):
    data = load_data()
    return render(request, 'core/about.html', {
        'data': data,
        'page': 'about',
    })


def projects(request):
    data = load_data()

    cat_meta = {
        'llm-ai':          {'label': 'LLM / AI',         'color': '#14F1D9', 'icon': '🧠'},
        'deep-learning':   {'label': 'Deep Learning',     'color': '#818CF8', 'icon': '⚡'},
        'computer-vision': {'label': 'Computer Vision',   'color': '#34D399', 'icon': '👁'},
        'data-analysis':   {'label': 'Data Analysis',     'color': '#60A5FA', 'icon': '📊'},
        'web-fullstack':   {'label': 'Web / Full-Stack',  'color': '#9B5DE5', 'icon': '🌐'},
    }

    for p in data['projects']:
        p['meta'] = cat_meta.get(p['category'], {'label': p['category'], 'color': '#818CF8', 'icon': '✦'})
        p['image_url'] = static(p['image']) if p.get('image') else None

    return render(request, 'core/projects.html', {
        'data':     data,
        'cat_meta': cat_meta,
        'page':     'projects',
    })


def experience(request):
    data = load_data()

    type_colors = {
        'Freelance':  '#14F1D9',
        'Internship': '#818CF8',
        'Full-Time':  '#34D399',
        'Contract':   '#9B5DE5',
    }

    for exp in data['experiences']:
        exp['type_color'] = type_colors.get(exp.get('type', ''), '#818CF8')

    return render(request, 'core/experience.html', {
        'data': data,
        'page': 'experience',
    })


def contact(request):
    data = load_data()
    sent = False
    error = False

    if request.method == 'POST':
        form = ContactForm(request.POST)
        if form.is_valid():
            cd = form.cleaned_data
            try:
                send_mail(
                    subject=f"[Portfolio] {cd['subject']}",
                    message=(
                        f"From: {cd['name']} <{cd['email']}>\n\n"
                        f"{cd['message']}"
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=['Theharsh1@outlook.com'],
                    fail_silently=False,
                )
                sent = True
                form = ContactForm()
            except Exception:
                error = True
    else:
        form = ContactForm()

    return render(request, 'core/contact.html', {
        'data':  data,
        'form':  form,
        'sent':  sent,
        'error': error,
        'page':  'contact',
    })
