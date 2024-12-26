<aside class="admonition {{kind}}"><header>

{%   if kind == "note"    -%}ℹ️
{% elif kind == "tip"     -%}💡
{% elif kind == "info"    -%}❕
{% elif kind == "warning" -%}⚠️
{% elif kind == "danger"  -%}🔥
{% endif -%} {{ title | default(value=kind) | capitalize }}

</header>

{{ body }}

</aside>
