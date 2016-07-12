<?php
/**
 * Created for analytics.
 * User: suman
 * Date: 08/4/16
 * Time: 6:26 PM
 */

class DOMUtil extends DOMDocument {
    public function createExternalScript($url)
    {
        $js = $this->createElement('script');
        $js->setAttribute('type', 'text/javascript');
        $js->setAttribute('src', $url);

        return $js;
    }

    public function createInlineScript($cdata)
    {
        $js = $this->createElement('script', $cdata);
        $js->setAttribute('type', 'text/javascript');

        return $js;
    }

    public function createExternalStyleSheet($url)
    {
        $css = $this->createElement('link');
        $css->setAttribute('type', 'text/css');
        $css->setAttribute('rel', 'stylesheet');
        $css->setAttribute('href', $url);

        return $css;
    }

    public function createInlineStyleSheet($styles)
    {
        $css = $this->createElement('style', $styles);
        $css->setAttribute('type', 'text/css');

        return $css;
    }

    public function createDiv($id, $content = "")
    {
        $div = $this->createElement('div', $content);
        $div->setAttribute('id', $id);

        return $div;
    }

    public function scriptExists($source)
    {
        $scripts = $this->getElementsByTagName("script");
        foreach ($scripts as $script) {
            $src = $script->getAttribute("src");
            if (strpos($src, $source) !== false) {
                return true;
            }
        }
        return false;
    }
}