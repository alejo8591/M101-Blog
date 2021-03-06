var services = require('../lib/data/services').services,
    querystring = require('querystring');

function isAuthenticated(req, res){
   return req.signedCookies.username ? true : false;
}

function renderNewPostPage(req, res, post){
    var postEntity = post || { title : '', body : '', tags : '' };
    res.render('newpost', { title : "Create a new post", post : postEntity});
}

function renderViewPostPage(req, res, post){
    var postEntity = post || { title : 'empty title', body : 'empty body', tags : [] },
        tagsJoined = post.tags.length ? post.tags.join(', ') : '';
    
    post.title = querystring.unescape(post.title).toUpperCase();
    post.stringOfTags = tagsJoined;
    
    res.render('viewpost', { title : "View post page", post : postEntity, isAuthenticated : isAuthenticated(req, res)});
}

exports.newEntry = function(req, res){
    if(!isAuthenticated(req,res)){
        res.redirect(301, '/login');
    }else{
        renderNewPostPage(req, res);
    }
    
}

exports.getViewEntry = function(req, res){
     services.getPostsService(function(err, ps){
        ps.getByPermalink(req.params['permalink'], 
            function(err, post){
                renderViewPostPage(req, res, post);
            }
        );
    });
}

exports.postNewEntry = function(req, res){
    if(isAuthenticated(req,res)){
        var username = req.signedCookies.username,
            postEntry = {
                title : req.body.post.title,
                body : req.body.post.body,
                author : username,
                tags : req.body.post.tags
            };
            
        services.getPostsService(function(err, ps){
            ps.createEntry(
                postEntry,
                function(err, posts){
                    console.log(err);
                    if(err){
                       renderNewPostPage(req, res, postEntry);
                    }else{
                       console.log(posts[0].permalink);
                       var redirectUrl = '/post/' + posts[0].permalink + '/view';
                       res.redirect(redirectUrl);
                    }
                }
            );
        });
    }else{
        res.redirect('/login');
    }
}

exports.postNewComment = function(req, res){
    var permalink = req.params['permalink'],
        comment = null;
        
    if(isAuthenticated(req, res)){
        comment = {
            author : req.signedCookies.username,            
            body : req.body.comment.body
        };
    }else{
        comment = {
            author : req.body.comment.author,
            email : req.body.comment.email,
            body : req.body.comment.body
        };
    }
    
    services.getPostsService(function(err, ps){
        ps.addCommentToPost(permalink, comment, function(err, countUpdated){
           res.redirect(301, '/post/'+ permalink + '/view');
        });
    });    
};